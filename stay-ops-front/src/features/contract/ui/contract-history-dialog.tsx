import { useMemo } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { PaymentStatusPill } from '@/features/payment/ui/payment-status-pill'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'
import { Dialog } from '@/shared/ui/dialog'

const numberFmt = new Intl.NumberFormat('ko-KR')
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

function thisMonthString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 계약 시작일 기준 상대 시간 — "오늘 계약" / "N일 전 계약" / "N개월 전 계약" / "N년 전 계약". */
function formatRelativeContract(startDate: string): string {
  const start = new Date(startDate)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '오늘 계약'
  if (diffDays < 0) return `${-diffDays}일 후 시작`
  if (diffDays < 31) return `${diffDays}일 전 계약`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전 계약`
  return `${Math.floor(diffDays / 365)}년 전 계약`
}

type Props = {
  open: boolean
  tenantName: string
  contracts: ContractResponse[]
  roomNumberById: Record<string, string>
  onClose: () => void
}

/**
 * 한 입주자의 모든 계약 이력을 read-only 로 보여준다.
 * ACTIVE 계약에는 이번 달 결제 배지를 함께 표시.
 */
export function ContractHistoryDialog({
  open,
  tenantName,
  contracts,
  roomNumberById,
  onClose,
}: Props) {
  const period = thisMonthString()
  const { data: monthPayments = [] } = usePaymentsQuery({ period }, { enabled: open })

  const paidContractIds = useMemo(() => {
    const set = new Set<string>()
    for (const p of monthPayments) {
      if (p.status === 'PAID') set.add(p.contractId)
    }
    return set
  }, [monthPayments])

  const refundedOnlyContractIds = useMemo(() => {
    const set = new Set<string>()
    for (const p of monthPayments) {
      if (p.status === 'REFUNDED' && !paidContractIds.has(p.contractId)) {
        set.add(p.contractId)
      }
    }
    return set
  }, [monthPayments, paidContractIds])

  return (
    <Dialog open={open} onClose={onClose} ariaLabel="계약 이력" maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">계약 이력</h2>
          <p className="text-xs text-[var(--muted)]">
            {tenantName} · 총 {contracts.length}건
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)]"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2 px-5 py-4">
        {contracts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--control)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            등록된 계약이 없습니다.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
            {contracts.map((c) => {
              const isActive = c.status === 'ACTIVE'
              const paymentStatus = !isActive
                ? null
                : paidContractIds.has(c.contractId)
                  ? 'PAID'
                  : refundedOnlyContractIds.has(c.contractId)
                    ? 'REFUNDED_ONLY'
                    : 'OVERDUE'
              return (
                <li
                  key={c.contractId}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {roomNumberById[c.roomId] ? `${roomNumberById[c.roomId]}호` : c.roomId.slice(0, 8)}
                    </span>
                    <span className="flex items-center gap-2">
                      {paymentStatus ? (
                        <PaymentStatusPill
                          status={paymentStatus}
                          title={`${period} ${paymentStatus === 'PAID' ? '완납' : paymentStatus === 'OVERDUE' ? '미납' : '환불됨'}`}
                        />
                      ) : null}
                      <span className="text-[11px] tabular-nums text-[var(--muted)]">
                        {formatRelativeContract(c.startDate)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>
                      {dateOnlyFmt.format(new Date(c.startDate))} ~{' '}
                      {dateOnlyFmt.format(new Date(c.endDate))}
                    </span>
                    <span className="tabular-nums">월 {numberFmt.format(c.monthlyRent)}원</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
