import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/features/payment/model/payment-types'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'

const numberFmt = new Intl.NumberFormat('ko-KR')

type Props = {
  contractId: string
  /** 최대 표시 건수. 기본 3. */
  limit?: number
}

/**
 * 한 계약의 최근 입금 내역 (최신 paidAt 순). 환불 건은 취소선 + 환불 배지.
 * 방 상세 / 입주자 드로어 양쪽에서 동일한 모양으로 노출한다.
 */
export function RecentPaymentsSection({ contractId, limit = 3 }: Props) {
  const { data: payments = [], isLoading } = usePaymentsQuery({ contractId })

  const items = payments.slice(0, limit)

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        최근 입금 내역
      </h3>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-[var(--control)]" />
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">— 등록된 입금 내역 없음 —</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]">
          {items.map((p) => {
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
    </section>
  )
}
