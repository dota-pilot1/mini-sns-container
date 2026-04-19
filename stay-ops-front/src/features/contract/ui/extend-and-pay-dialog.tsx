import { useEffect, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
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

type Props = {
  /** null 이면 닫힘. 연장 대상 계약이 들어오면 열림. */
  contract: ContractResponse | null
  tenantName: string
  roomNumber?: string
  onClose: () => void
  onDone?: () => void
}

const PRESETS = [1, 2, 3] as const

/**
 * 계약 연장 + 결제 통합 다이얼로그.
 * N 개월 프리셋을 고르면 해당 기간의 결제 금액(monthlyRent × N)이 자동 계산되고,
 * 확인 시 backend 가 원자적으로 contract.endDate 연장 + N 건의 PAID 결제를 생성한다.
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

  useEffect(() => {
    if (open && contract) {
      setMonths(1)
      setAmountPerMonth(contract.monthlyRent)
      setTopError(null)
    }
  }, [open, contract])

  const total = amountPerMonth * months
  const projectedEndDate = contract ? addMonthString(contract.endDate, months) : ''

  const submit = async () => {
    if (!contract) return
    if (months <= 0) {
      setTopError('연장 기간은 1개월 이상이어야 합니다.')
      return
    }
    if (amountPerMonth < 0) {
      setTopError('결제 금액은 0 이상이어야 합니다.')
      return
    }
    setTopError(null)
    try {
      await extendAndPay.mutateAsync({
        contractId: contract.contractId,
        body: {
          months,
          amountPerMonth,
          method: 'CASH',
        },
      })
      onDone?.()
      onClose()
    } catch (err) {
      setTopError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '계약 연장에 실패했습니다.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (extendAndPay.isPending ? undefined : onClose())}
      ariaLabel="계약 연장"
      maxWidth="max-w-md"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">계약 연장</h2>
          <p className="text-xs text-[var(--muted)]">
            {tenantName}
            {roomNumber ? ` · ${roomNumber}호` : ''}
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

      <div className="flex flex-col gap-4 px-5 py-5">
        {contract ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2.5 text-xs">
            <dt className="text-[var(--muted)]">현재 종료일</dt>
            <dd className="text-right tabular-nums text-[var(--foreground)]">
              {dateOnlyFmt.format(new Date(contract.endDate))}
            </dd>
            <dt className="text-[var(--muted)]">월세</dt>
            <dd className="text-right tabular-nums text-[var(--foreground)]">
              {numberFmt.format(contract.monthlyRent)}원
            </dd>
          </dl>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--muted)]">연장 기간</span>
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
          <dt className="text-[var(--muted)]">연장 후 종료일</dt>
          <dd className="text-right tabular-nums font-semibold text-[var(--foreground)]">
            {projectedEndDate ? dateOnlyFmt.format(new Date(projectedEndDate)) : '—'}
          </dd>
          <dt className="text-[var(--muted)]">총 결제 금액</dt>
          <dd className="text-right tabular-nums font-semibold text-[var(--accent)]">
            {numberFmt.format(total)}원
          </dd>
        </dl>

        {topError ? <p className="text-xs text-rose-500">{topError}</p> : null}

        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={extendAndPay.isPending}
            className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={extendAndPay.isPending}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {extendAndPay.isPending ? '처리 중…' : '결제 + 연장'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]'
