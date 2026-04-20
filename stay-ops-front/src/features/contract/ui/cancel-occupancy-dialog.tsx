import { useEffect, useMemo, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { deriveContractState } from '@/features/contract/model/contract-types'
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
  /** null 이면 닫힘. 취소 가능한 계약 체인(PAST 포함 가능). */
  chain: ContractResponse[] | null
  /** 열릴 때 사전 선택할 계약. 없으면 EFFECTIVE → 첫 번째 순으로 자동 선택. */
  initialContractId?: string
  tenantName: string
  roomNumber?: string
  onClose: () => void
  onDone?: () => void
}

/**
 * 계약 취소 다이얼로그 — 계약 종료 + 관련 PAID 결제 일괄 환불을 한 번에.
 *
 * 좌측에 해당 입주자의 계약 목록(지난 계약은 선택 불가), 우측에 종료일/환불 정보.
 * 백엔드 `POST /contracts/{id}/cancel-occupancy` 를 호출한다.
 */
export function CancelOccupancyDialog({
  chain,
  initialContractId,
  tenantName,
  roomNumber,
  onClose,
  onDone,
}: Props) {
  const open = chain !== null
  const cancelMutation = useCancelOccupancy()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [moveOutDate, setMoveOutDate] = useState<string>(todayLocalISO())
  const [refundDeposit, setRefundDeposit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedChain = useMemo(
    () =>
      (chain ?? [])
        .slice()
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [chain],
  )

  const cancelable = useMemo(
    () => sortedChain.filter((c) => deriveContractState(c) !== 'CANCELLED'),
    [sortedChain],
  )

  const contract = useMemo(
    () => sortedChain.find((c) => c.contractId === selectedId) ?? null,
    [sortedChain, selectedId],
  )

  // open 되면 initialContractId(취소 가능한 경우) → EFFECTIVE → 첫 번째 취소 가능 순으로 자동 선택
  useEffect(() => {
    if (!open) return
    const initial =
      initialContractId && cancelable.find((c) => c.contractId === initialContractId)
    const effective = cancelable.find((c) => deriveContractState(c) === 'EFFECTIVE')
    setSelectedId((initial ?? effective ?? cancelable[0])?.contractId ?? null)
  }, [open, cancelable, initialContractId])

  const { data: payments = [] } = usePaymentsQuery(
    { contractId: contract?.contractId },
    { enabled: open && !!contract },
  )

  const selectedState = contract ? deriveContractState(contract) : null

  useEffect(() => {
    if (!open || !contract) return
    const today = todayLocalISO()
    // UPCOMING: 아직 시작 안 함 → startDate
    // OVERDUE: endDate 지남 → today (실제 퇴실일)
    // EFFECTIVE: today
    if (today < contract.startDate) setMoveOutDate(contract.startDate)
    else setMoveOutDate(today)
    // OVERDUE 는 이미 종료된 계약이라 보증금 환불이 주된 작업 → 기본 ON
    setRefundDeposit(selectedState === 'OVERDUE')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const dialogTitle = selectedState === 'OVERDUE' ? '퇴실 처리' : '계약 취소'
  const submitLabel = selectedState === 'OVERDUE' ? '퇴실 처리' : '계약 취소'

  return (
    <Dialog
      open={open}
      onClose={() => (running ? undefined : onClose())}
      ariaLabel={dialogTitle}
      maxWidth="max-w-3xl"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">{dialogTitle}</h2>
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

      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1.2fr]">
        {/* Left: 계약 목록 (PAST 는 비활성) */}
        <section className="flex flex-col gap-2 border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            계약 목록 · 총 {sortedChain.length}건
          </h3>
          {sortedChain.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--control)] px-3 py-6 text-center text-xs text-[var(--muted)]">
              계약 없음
            </p>
          ) : (
            <ul className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto pr-1">
              {sortedChain.map((c) => {
                const state = deriveContractState(c)
                const disabled = state === 'CANCELLED'
                const isSelected = contract?.contractId === c.contractId
                return (
                  <li key={c.contractId}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedId(c.contractId)}
                      className={[
                        'flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 text-left text-xs transition',
                        disabled
                          ? 'cursor-not-allowed border-[var(--border)] bg-[var(--control)] opacity-50'
                          : isSelected
                            ? 'border-rose-500 bg-rose-500/5'
                            : 'border-[var(--border)] bg-[var(--surface-strong)] hover:border-rose-500/60',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--foreground)]">
                          {c.startDate} ~ {c.endDate}
                        </span>
                        <span
                          className={[
                            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                            state === 'EFFECTIVE'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : state === 'UPCOMING'
                                ? 'bg-amber-500/15 text-amber-600'
                                : state === 'OVERDUE'
                                  ? 'bg-rose-500/15 text-rose-600'
                                  : 'bg-slate-500/15 text-slate-500',
                          ].join(' ')}
                        >
                          {state === 'EFFECTIVE'
                            ? '거주중'
                            : state === 'UPCOMING'
                              ? '예정'
                              : state === 'OVERDUE'
                                ? '연체'
                                : '퇴실'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between tabular-nums text-[var(--muted)]">
                        <span>월 {numberFmt.format(c.monthlyRent)}원</span>
                        {isSelected ? (
                          <span className="text-[10px] font-medium text-rose-500">
                            취소 대상
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {cancelable.length === 0 ? (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
              취소 가능한 계약이 없습니다. 지난 계약은 취소 대상이 아닙니다.
            </p>
          ) : null}
        </section>

        {/* Right: 종료일 + 환불 */}
        <section className="flex flex-col gap-3 p-5">
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

          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            환불 대상 결제
          </h3>

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
            {running ? '처리 중…' : submitLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
