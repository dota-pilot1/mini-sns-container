import { useEffect, useMemo, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { useCancelOccupancy } from '@/features/contract/model/use-cancel-occupancy'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

const numberFmt = new Intl.NumberFormat('ko-KR')

function todayLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso)
  const b = new Date(bIso)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

type Props = {
  /** null 이면 닫힘. 계약 취소할 계약이 들어오면 열림. */
  contract: ContractResponse | null
  tenantName: string
  roomNumber?: string
  onClose: () => void
  onDone?: () => void
}

/**
 * 계약 취소 다이얼로그 — 계약 종료 + 관련 PAID 결제 일괄 환불을 한 번에.
 *
 * 백엔드 `POST /contracts/{id}/cancel-occupancy` 를 호출한다. 트랜잭션이 합쳐져 있어
 * 환불 일부만 실패해 계약만 종료되는 유령 상태가 발생하지 않는다.
 */
export function CancelOccupancyDialog({
  contract,
  tenantName,
  roomNumber,
  onClose,
  onDone,
}: Props) {
  const open = contract !== null
  const cancelMutation = useCancelOccupancy()
  const [moveOutDate, setMoveOutDate] = useState<string>(todayLocalISO())
  const [refundDeposit, setRefundDeposit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: payments = [] } = usePaymentsQuery(
    { contractId: contract?.contractId },
    { enabled: open },
  )

  useEffect(() => {
    if (!open || !contract) return
    const today = todayLocalISO()
    if (today < contract.startDate) setMoveOutDate(contract.startDate)
    else if (today > contract.endDate) setMoveOutDate(contract.endDate)
    else setMoveOutDate(today)
    setRefundDeposit(false)
    setError(null)
  }, [open, contract])

  const paidOnly = useMemo(
    () => payments.filter((p) => p.status === 'PAID'),
    [payments],
  )
  const totalPaid = paidOnly.reduce((a, p) => a + p.amount, 0)

  const prorated = useMemo(() => {
    if (!contract) return { usedDays: 0, totalDays: 0, usedAmount: 0, refundAmount: totalPaid }
    const totalDays = daysBetween(contract.startDate, contract.endDate)
    const usedDaysRaw = daysBetween(contract.startDate, moveOutDate)
    const usedDays = Math.max(0, Math.min(totalDays, usedDaysRaw))
    const usedRatio = totalDays > 0 ? usedDays / totalDays : 0
    const usedAmount = Math.round(totalPaid * usedRatio)
    const refundAmount = totalPaid - usedAmount
    return { usedDays, totalDays, usedAmount, refundAmount }
  }, [contract, moveOutDate, totalPaid])

  const depositAmount = contract?.deposit ?? 0
  const finalRefund = prorated.refundAmount + (refundDeposit ? depositAmount : 0)

  const submit = () => {
    if (!contract) return
    setError(null)
    cancelMutation.mutate(
      {
        contractId: contract.contractId,
        moveOutDate,
        refundDeposit,
      },
      {
        onSuccess: () => {
          onDone?.()
          onClose()
        },
        onError: (err) => {
          const msg =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : '계약 취소 실패'
          setError(msg)
        },
      },
    )
  }

  const running = cancelMutation.isPending

  return (
    <Dialog
      open={open}
      onClose={() => (running ? undefined : onClose())}
      ariaLabel="계약 취소"
      maxWidth="max-w-3xl"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">계약 취소</h2>
          <p className="text-xs text-[var(--muted)]">
            {tenantName}
            {roomNumber ? ` · ${roomNumber}호` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={running}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        {/* Left: 종료일 + 옵션 */}
        <section className="flex flex-col gap-3 border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
          <h3 className="text-sm font-semibold">종료일</h3>

          {contract ? (
            <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--control)] p-3">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>종료일</span>
                <span className="tabular-nums font-semibold text-[var(--foreground)]">
                  {moveOutDate}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={prorated.totalDays}
                step={1}
                value={prorated.usedDays}
                onChange={(e) =>
                  setMoveOutDate(addDays(contract.startDate, Number(e.target.value)))
                }
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex items-center justify-between text-[10px] text-[var(--muted)] tabular-nums">
                <span>{contract.startDate}</span>
                <span>{contract.endDate}</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full bg-rose-400 transition-all"
                  style={{
                    width: `${
                      prorated.totalDays > 0
                        ? (prorated.usedDays / prorated.totalDays) * 100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className="h-full bg-emerald-400 transition-all"
                  style={{
                    width: `${
                      prorated.totalDays > 0
                        ? ((prorated.totalDays - prorated.usedDays) / prorated.totalDays) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] tabular-nums">
                <span className="text-rose-500">사용 {prorated.usedDays}일</span>
                <span className="text-emerald-600">
                  잔여 {Math.max(0, prorated.totalDays - prorated.usedDays)}일
                </span>
              </div>
            </div>
          ) : null}

          <label className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--control)] p-3 text-sm">
            <input
              type="checkbox"
              checked={refundDeposit}
              onChange={(e) => setRefundDeposit(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">보증금 환불</span>
              <span className="text-xs text-[var(--muted)]">
                {numberFmt.format(depositAmount)}원 을 환불액에 포함 (안내용)
              </span>
            </span>
          </label>
        </section>

        {/* Right: 환불 금액 */}
        <section className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-semibold">환불 대상 결제</h3>

          {paidOnly.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-3 py-4 text-center text-xs text-[var(--muted)]">
              환불할 PAID 결제 없음
            </p>
          ) : (
            <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs">
              {paidOnly.map((p) => (
                <li key={p.id} className="flex items-center justify-between tabular-nums">
                  <span>{p.periodYearMonth}</span>
                  <span>{numberFmt.format(p.amount)}원</span>
                </li>
              ))}
            </ul>
          )}

          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2.5 text-sm">
            <dt className="text-[var(--muted)]">PAID 합계</dt>
            <dd className="text-right tabular-nums font-semibold text-[var(--foreground)]">
              {numberFmt.format(totalPaid)}원
            </dd>
            <dt className="text-[var(--muted)]">사용분 차감 (일할)</dt>
            <dd className="text-right tabular-nums text-rose-500">
              − {numberFmt.format(prorated.usedAmount)}원
            </dd>
            <dt className="text-[var(--muted)]">결제 환불 소계</dt>
            <dd className="text-right tabular-nums text-[var(--foreground)]">
              {numberFmt.format(prorated.refundAmount)}원
            </dd>
            {refundDeposit ? (
              <>
                <dt className="text-[var(--muted)]">보증금 환불</dt>
                <dd className="text-right tabular-nums text-emerald-600">
                  + {numberFmt.format(depositAmount)}원
                </dd>
              </>
            ) : null}
            <dt className="border-t border-[var(--accent)]/20 pt-1 text-[var(--foreground)] font-semibold">
              실제 환불 권장
            </dt>
            <dd className="border-t border-[var(--accent)]/20 pt-1 text-right tabular-nums font-bold text-[var(--accent)]">
              {numberFmt.format(finalRefund)}원
            </dd>
          </dl>

          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
            ⚠︎ 현재 API 는 PAID 전액 환불만 지원합니다. "권장" 금액은 운영 기준 안내용이며,
            부분 환불/보증금 환불 기능은 추후 별도 처리 필요.
          </p>
        </section>
      </div>

      {error ? (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-rose-500">{error}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--control)] px-5 py-3">
        <span className="text-xs text-[var(--muted)]">
          계약 종료
          {paidOnly.length > 0 ? ` + PAID ${paidOnly.length}건 환불` : ''}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--control-hover)] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={running || !contract}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
          >
            {running ? '처리 중…' : '계약 취소'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
