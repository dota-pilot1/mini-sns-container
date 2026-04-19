import { useMemo } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/features/payment/model/payment-types'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'

const numberFmt = new Intl.NumberFormat('ko-KR')
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

type Props = {
  /** 한 입주자의 계약 목록 (startDate 내림차순). */
  contracts: ContractResponse[]
  roomNumberById: Record<string, string>
}

/**
 * 입주자 드로어 전용 결제 이력. 입주자가 가진 모든 계약의 결제를
 * 계약별로 그룹핑해서 표시한다 (계약 startDate 내림차순, 그 안 paidAt 내림차순).
 */
export function TenantPaymentsHistorySection({ contracts, roomNumberById }: Props) {
  return (
    <section className="flex flex-col gap-2 px-5 py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        결제 이력
      </h3>
      {contracts.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">계약이 없어 결제 내역도 없음</p>
      ) : (
        <div className="flex flex-col gap-3">
          {contracts.map((c) => (
            <PaymentsForContract
              key={c.contractId}
              contract={c}
              roomNumber={roomNumberById[c.roomId]}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PaymentsForContract({
  contract,
  roomNumber,
}: {
  contract: ContractResponse
  roomNumber?: string
}) {
  const { data: payments = [], isLoading } = usePaymentsQuery({
    contractId: contract.contractId,
  })

  const sorted = useMemo(
    () => [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    [payments],
  )

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]">
      <header className="flex items-baseline justify-between gap-2 border-b border-[var(--border)] px-3 py-2 text-[11px] text-[var(--muted)]">
        <span className="font-semibold text-[var(--foreground)]">
          {roomNumber ? `${roomNumber}호` : contract.contractId.slice(0, 8)}
        </span>
        <span className="tabular-nums">
          {dateOnlyFmt.format(new Date(contract.startDate))} ~{' '}
          {dateOnlyFmt.format(new Date(contract.endDate))}
        </span>
      </header>
      {isLoading ? (
        <div className="h-8 animate-pulse bg-[var(--control)]" />
      ) : sorted.length === 0 ? (
        <p className="px-3 py-3 text-[11px] text-[var(--muted)]">— 입금 내역 없음 —</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {sorted.map((p) => {
            const refunded = p.status === 'REFUNDED'
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
              >
                <div className="flex flex-col">
                  <span
                    className={[
                      'font-medium tracking-[-0.01em]',
                      refunded ? 'text-[var(--muted)] line-through' : 'text-[var(--foreground)]',
                    ].join(' ')}
                  >
                    {p.periodYearMonth} · {numberFmt.format(p.amount)}원
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {p.paidAt.slice(0, 10)} · {PAYMENT_METHOD_LABEL[p.method]}
                  </span>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    refunded
                      ? 'bg-rose-500/15 text-rose-500'
                      : 'bg-emerald-500/15 text-emerald-600',
                  ].join(' ')}
                >
                  {PAYMENT_STATUS_LABEL[p.status]}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
