import { useMemo, useState } from 'react'

import { useContractsQuery } from '@/features/contract/model/use-contracts'
import type { OverduePaymentResponse, PaymentResponse } from '@/features/payment/api/payment-api'
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type PaymentStatus,
} from '@/features/payment/model/payment-types'
import { useDeletePayment } from '@/features/payment/model/use-delete-payment'
import { useOverduePaymentsQuery } from '@/features/payment/model/use-overdue-payments'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'
import {
  RefundPaymentDialog,
  type RefundTarget,
} from '@/features/payment/ui/refund-payment-dialog'
import {
  RegisterPaymentDialog,
  type RegisterPaymentTarget,
} from '@/features/payment/ui/register-payment-dialog'
import { useRoomsQuery } from '@/features/room/model/use-rooms'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import { ConfirmDialog } from '@/shared/ui/dialog'

const numberFmt = new Intl.NumberFormat('ko-KR')

type Tab = 'OVERDUE' | 'PAID' | 'REFUNDED' | 'ALL'

const TAB_LABEL: Record<Tab, string> = {
  OVERDUE: '미납',
  PAID: '완납',
  REFUNDED: '환불',
  ALL: '전체',
}

function thisMonthString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function PaymentListPage() {
  const [period, setPeriod] = useState<string>(thisMonthString())
  const [tab, setTab] = useState<Tab>('OVERDUE')
  const [registerTarget, setRegisterTarget] = useState<RegisterPaymentTarget | null>(null)
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentResponse | null>(null)

  const { data: tenants = [] } = useTenantsQuery()
  const { data: rooms = [] } = useRoomsQuery()
  const { data: contracts = [] } = useContractsQuery()
  const { data: overdue = [], isLoading: overdueLoading } = useOverduePaymentsQuery(period)
  const paidStatus: PaymentStatus | undefined =
    tab === 'PAID' ? 'PAID' : tab === 'REFUNDED' ? 'REFUNDED' : undefined
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsQuery({
    period,
    status: paidStatus,
  })

  const tenantNameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const t of tenants) m[t.tenantId] = t.name
    return m
  }, [tenants])

  const roomNumberById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const r of rooms) m[r.roomId] = r.roomNumber
    return m
  }, [rooms])

  const contractById = useMemo(() => {
    const m: Record<string, (typeof contracts)[number]> = {}
    for (const c of contracts) m[c.contractId] = c
    return m
  }, [contracts])

  const deleteMutation = useDeletePayment()

  const openRegisterFor = (entry: OverduePaymentResponse) => {
    setRegisterTarget({
      contractId: entry.contractId,
      periodYearMonth: period,
      defaultAmount: entry.expectedAmount,
      tenantName: entry.tenantName,
      roomNumber: entry.roomNumber,
    })
  }

  const openRegisterForPaid = (p: PaymentResponse) => {
    const c = contractById[p.contractId]
    setRegisterTarget({
      contractId: p.contractId,
      periodYearMonth: period,
      defaultAmount: c?.monthlyRent ?? p.amount,
      tenantName: c ? tenantNameById[c.tenantId] : undefined,
      roomNumber: c ? roomNumberById[c.roomId] : undefined,
    })
  }

  const visiblePayments = payments
  const showRegisterFromPaidEmpty = tab === 'PAID' && visiblePayments.length === 0

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // 에러는 mutation 의 isError 로 표시되어도 되지만 단순화: alert 없이 닫지 않음
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-[-0.02em]">결제 관리</h1>
          <p className="text-xs text-[var(--muted)]">
            관리자가 입금을 직접 확인 후 등록합니다. 토스/계좌 자동화는 추후 도입.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>기준월</span>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>
      </header>

      <nav className="inline-flex w-fit rounded-md border border-[var(--border)] bg-[var(--control)] p-0.5">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'inline-flex min-w-20 items-center justify-center rounded px-3 py-1 text-[13px] font-medium tracking-[-0.01em] transition',
              tab === t
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--control-hover)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            {TAB_LABEL[t]}
            {t === 'OVERDUE' && overdue.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {overdue.length}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === 'OVERDUE' ? (
        <OverdueSection
          loading={overdueLoading}
          items={overdue}
          period={period}
          onRegister={openRegisterFor}
        />
      ) : (
        <PaymentsSection
          loading={paymentsLoading}
          items={visiblePayments}
          tenantNameById={tenantNameById}
          roomNumberById={roomNumberById}
          contractById={contractById}
          onRefund={(p) =>
            setRefundTarget({
              paymentId: p.id,
              periodYearMonth: p.periodYearMonth,
              amount: p.amount,
              defaultNote: p.note,
            })
          }
          onDelete={(p) => setDeleteTarget(p)}
          onRegisterAgain={openRegisterForPaid}
          showRegisterShortcut={showRegisterFromPaidEmpty}
        />
      )}

      <RegisterPaymentDialog
        target={registerTarget}
        onClose={() => setRegisterTarget(null)}
      />
      <RefundPaymentDialog
        target={refundTarget}
        onClose={() => setRefundTarget(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => (deleteMutation.isPending ? undefined : setDeleteTarget(null))}
        onConfirm={confirmDelete}
        title="결제 레코드 삭제"
        description={
          deleteTarget
            ? `${deleteTarget.periodYearMonth} · ${numberFmt.format(deleteTarget.amount)}원 결제를 완전히 삭제합니다. 환불이 아닌 "잘못 입력한 레코드"인 경우에만 사용하세요.`
            : undefined
        }
        confirmLabel="삭제"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function OverdueSection({
  loading,
  items,
  period,
  onRegister,
}: {
  loading: boolean
  items: OverduePaymentResponse[]
  period: string
  onRegister: (entry: OverduePaymentResponse) => void
}) {
  if (loading) return <EmptyState text="불러오는 중…" />
  if (items.length === 0) {
    return <EmptyState text={`${period} 미납자가 없습니다. 👍`} />
  }
  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {items.map((it) => (
        <li
          key={it.contractId}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold">{it.tenantName}</span>
              <span className="text-xs text-[var(--muted)]">{it.roomNumber}호</span>
            </div>
            <span className="text-xs text-[var(--muted)]">
              {numberFmt.format(it.expectedAmount)}원
              {it.daysOverdue > 0 ? ` · ${it.daysOverdue}일 연체` : ' · 이번 달'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRegister(it)}
            className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            입금 확인
          </button>
        </li>
      ))}
    </ul>
  )
}

function PaymentsSection({
  loading,
  items,
  tenantNameById,
  roomNumberById,
  contractById,
  onRefund,
  onDelete,
  onRegisterAgain,
  showRegisterShortcut,
}: {
  loading: boolean
  items: PaymentResponse[]
  tenantNameById: Record<string, string>
  roomNumberById: Record<string, string>
  contractById: Record<string, { tenantId: string; roomId: string }>
  onRefund: (p: PaymentResponse) => void
  onDelete: (p: PaymentResponse) => void
  onRegisterAgain: (p: PaymentResponse) => void
  showRegisterShortcut: boolean
}) {
  if (loading) return <EmptyState text="불러오는 중…" />
  if (items.length === 0) {
    return (
      <EmptyState
        text={
          showRegisterShortcut
            ? '이번 달 등록된 결제가 없습니다. 미납 탭에서 입금을 등록하세요.'
            : '표시할 결제 내역이 없습니다.'
        }
      />
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--control)] text-xs uppercase text-[var(--muted)]">
          <tr>
            <th className="px-3 py-2 text-left">기준월</th>
            <th className="px-3 py-2 text-left">입주자</th>
            <th className="px-3 py-2 text-left">방</th>
            <th className="px-3 py-2 text-right">금액</th>
            <th className="px-3 py-2 text-left">수단</th>
            <th className="px-3 py-2 text-left">상태</th>
            <th className="px-3 py-2 text-left">입금일</th>
            <th className="px-3 py-2 text-right" />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const contract = contractById[p.contractId]
            const tenantName = contract ? tenantNameById[contract.tenantId] : '-'
            const roomNumber = contract ? roomNumberById[contract.roomId] : '-'
            const refunded = p.status === 'REFUNDED'
            return (
              <tr
                key={p.id}
                className={[
                  'border-t border-[var(--border)]',
                  refunded ? 'text-[var(--muted)]' : '',
                ].join(' ')}
              >
                <td className="px-3 py-2">{p.periodYearMonth}</td>
                <td
                  className={[
                    'px-3 py-2',
                    refunded ? 'line-through' : 'font-medium',
                  ].join(' ')}
                >
                  {tenantName ?? '-'}
                </td>
                <td className="px-3 py-2">{roomNumber ?? '-'}호</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {numberFmt.format(p.amount)}
                </td>
                <td className="px-3 py-2">{PAYMENT_METHOD_LABEL[p.method]}</td>
                <td className="px-3 py-2">
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      refunded
                        ? 'bg-rose-500/15 text-rose-500'
                        : 'bg-emerald-500/15 text-emerald-600',
                    ].join(' ')}
                  >
                    {PAYMENT_STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums">{p.paidAt.slice(0, 10)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    {!refunded ? (
                      <button
                        type="button"
                        onClick={() => onRefund(p)}
                        className="rounded-md border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--control-hover)]"
                      >
                        환불
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRegisterAgain(p)}
                        className="rounded-md border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--control-hover)]"
                      >
                        재등록
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className="rounded-md border border-rose-500/40 bg-transparent px-2 py-1 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--control)] px-4 py-10 text-center text-sm text-[var(--muted)]">
      {text}
    </div>
  )
}
