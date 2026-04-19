import { useEffect, useMemo, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { deriveContractState } from '@/features/contract/model/contract-types'
import { useContractsQuery } from '@/features/contract/model/use-contracts'
import { useExtendAndPay } from '@/features/contract/model/use-extend-and-pay'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

const numberFmt = new Intl.NumberFormat('ko-KR')
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

/**
 * Java `LocalDate.plusMonths()` 동작과 맞추기 위해 끝말의 overflow 를 clamp 한다.
 * 예) 2026-01-31 +1달 → 2026-02-28 (JS 기본 동작이면 2026-03-03 이 되므로 수동 보정).
 */
function addMonthString(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const targetMonthIndex = m - 1 + months
  const targetYear = y + Math.floor(targetMonthIndex / 12)
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const day = Math.min(d, lastDayOfTargetMonth)
  const mm = String(targetMonth + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${targetYear}-${mm}-${dd}`
}

function addDaysString(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

type Props = {
  /** null 이면 닫힘. 기준이 되는(이전) 계약이 들어오면 열림. 새 계약은 이 계약의 체인에 추가됨. */
  contract: ContractResponse | null
  tenantName: string
  roomNumber?: string
  onClose: () => void
  onDone?: () => void
}

const PRESETS = [1, 2, 3] as const

/**
 * 계약 추가 다이얼로그 — 좌측에 이 입주자의 계약 체인(이력), 우측에 새 계약 폼.
 *
 * <p>"연장" 이 아니라 실제로는 기존 계약에 체인을 걸어 새 Contract 를 만든다.
 * 새 계약의 시작일 = 기존 endDate + 1일, 기간 = 프리셋(+N개월), 월세 = 수정 가능
 * (기본값은 기존 계약 월세 승계). 확인 시 backend 가 원자적으로 Contract 생성 +
 * N 건의 PAID 결제를 생성한다.
 */
export function ExtendAndPayDialog({
  contract,
  tenantName,
  roomNumber,
  onClose,
  onDone,
}: Props) {
  const open = contract !== null
  const extendAndPay = useExtendAndPay()
  const [months, setMonths] = useState(1)
  const [amountPerMonth, setAmountPerMonth] = useState(0)
  const [topError, setTopError] = useState<string | null>(null)

  const { data: chain = [] } = useContractsQuery(
    contract ? { tenantId: contract.tenantId } : {},
    { enabled: open },
  )

  const history = useMemo(
    () =>
      chain
        .slice()
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [chain],
  )

  // 기준 계약은 "가장 최근에 추가된 것" = 히스토리의 맨 위. 추가할 때마다 자동으로 갱신되어
  // 다음 추가는 방금 추가한 계약에 체인으로 걸린다. 쿼리가 아직 로드되지 않았으면 prop 사용.
  const baseContract = history[0] ?? contract

  useEffect(() => {
    if (open && contract) {
      setMonths(1)
      setTopError(null)
    }
  }, [open, contract])

  // baseContract 가 바뀌면 (처음 열렸을 때 or 추가 후 갱신) 월세 기본값을 승계.
  // 사용자가 수동으로 바꾼 값이 있어도 새 기준 계약의 월세로 리셋한다.
  const baseContractId = baseContract?.contractId
  useEffect(() => {
    if (baseContract) {
      setAmountPerMonth(baseContract.monthlyRent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseContractId])

  const total = amountPerMonth * months
  const newStartDate = baseContract ? addDaysString(baseContract.endDate, 1) : ''
  const newEndDate = newStartDate ? addDaysString(addMonthString(newStartDate, months), -1) : ''

  const submit = async () => {
    if (!baseContract) return
    if (months <= 0) {
      setTopError('기간은 1개월 이상이어야 합니다.')
      return
    }
    if (amountPerMonth < 0) {
      setTopError('결제 금액은 0 이상이어야 합니다.')
      return
    }
    setTopError(null)
    try {
      await extendAndPay.mutateAsync({
        contractId: baseContract.contractId,
        body: {
          months,
          amountPerMonth,
          method: 'CASH',
        },
      })
      onDone?.()
      // 다이얼로그 유지 — 리스트가 갱신되고 baseContract 가 방금 추가된 계약으로 이동하므로
      // 연속으로 추가할 수 있다. 기간만 +1달 기본값으로 리셋.
      setMonths(1)
    } catch (err) {
      setTopError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '계약 추가에 실패했습니다.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (extendAndPay.isPending ? undefined : onClose())}
      ariaLabel="계약 추가"
      maxWidth="max-w-3xl"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">계약 추가</h2>
          <p className="text-xs text-[var(--muted)]">
            {tenantName}
            {roomNumber ? ` · ${roomNumber}호` : ''} · 이전 계약 체인에 연결
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={extendAndPay.isPending}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1.2fr]">
        {/* Left: 계약 이력 */}
        <section className="flex flex-col gap-2 border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            계약 이력 · 총 {history.length}건
          </h3>
          {history.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--control)] px-3 py-6 text-center text-xs text-[var(--muted)]">
              이력 없음
            </p>
          ) : (
            <ul className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto pr-1">
              {history.map((c) => {
                const state = deriveContractState(c)
                const isBase = baseContract?.contractId === c.contractId
                return (
                  <li
                    key={c.contractId}
                    className={[
                      'flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-xs',
                      isBase
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] bg-[var(--surface-strong)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--foreground)]">
                        {dateOnlyFmt.format(new Date(c.startDate))} ~{' '}
                        {dateOnlyFmt.format(new Date(c.endDate))}
                      </span>
                      <span
                        className={[
                          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          state === 'EFFECTIVE'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : state === 'UPCOMING'
                              ? 'bg-amber-500/15 text-amber-600'
                              : 'bg-slate-500/15 text-slate-500',
                        ].join(' ')}
                      >
                        {state === 'EFFECTIVE'
                          ? '거주중'
                          : state === 'UPCOMING'
                            ? '예정'
                            : '지남'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between tabular-nums text-[var(--muted)]">
                      <span>월 {numberFmt.format(c.monthlyRent)}원</span>
                      {isBase ? (
                        <span className="text-[10px] font-medium text-[var(--accent)]">
                          기준 계약
                        </span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Right: 새 계약 폼 */}
        <section className="flex flex-col gap-4 p-5">
          {baseContract ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2.5 text-xs">
              <dt className="text-[var(--muted)]">기준 계약 종료일</dt>
              <dd className="text-right tabular-nums text-[var(--foreground)]">
                {dateOnlyFmt.format(new Date(baseContract.endDate))}
              </dd>
              <dt className="text-[var(--muted)]">월세 (승계)</dt>
              <dd className="text-right tabular-nums text-[var(--foreground)]">
                {numberFmt.format(baseContract.monthlyRent)}원
              </dd>
            </dl>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[var(--muted)]">계약 기간</span>
            <div className="flex gap-2">
              {PRESETS.map((n) => {
                const active = months === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMonths(n)}
                    className={[
                      'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border)] bg-[var(--control)] text-[var(--foreground)] hover:border-[var(--accent)]',
                    ].join(' ')}
                  >
                    +{n}달
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--muted)]">월 결제 금액 (원)</span>
            <input
              type="number"
              inputMode="numeric"
              value={amountPerMonth}
              onChange={(e) => setAmountPerMonth(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </label>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-3 py-2.5 text-xs">
            <dt className="text-[var(--muted)]">시작일</dt>
            <dd className="text-right tabular-nums font-semibold text-[var(--foreground)]">
              {newStartDate ? dateOnlyFmt.format(new Date(newStartDate)) : '—'}
            </dd>
            <dt className="text-[var(--muted)]">종료일</dt>
            <dd className="text-right tabular-nums font-semibold text-[var(--foreground)]">
              {newEndDate ? dateOnlyFmt.format(new Date(newEndDate)) : '—'}
            </dd>
            <dt className="text-[var(--muted)]">총 결제 금액</dt>
            <dd className="text-right tabular-nums font-semibold text-[var(--accent)]">
              {numberFmt.format(total)}원
            </dd>
          </dl>

          {topError ? <p className="text-xs text-rose-500">{topError}</p> : null}

          <div className="mt-auto flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={extendAndPay.isPending}
              className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={extendAndPay.isPending}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {extendAndPay.isPending ? '처리 중…' : '결제 + 추가'}
            </button>
          </div>
        </section>
      </div>
    </Dialog>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]'
