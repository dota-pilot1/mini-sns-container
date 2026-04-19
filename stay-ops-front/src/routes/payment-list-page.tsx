import { useMemo, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { useContractsQuery } from '@/features/contract/model/use-contracts'
import { ExtendAndPayDialog } from '@/features/contract/ui/extend-and-pay-dialog'
import type { PaymentResponse } from '@/features/payment/api/payment-api'
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type PaymentStatus,
} from '@/features/payment/model/payment-types'
import { useDeletePayment } from '@/features/payment/model/use-delete-payment'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'
import {
  RegisterPaymentDialog,
  type RegisterPaymentTarget,
} from '@/features/payment/ui/register-payment-dialog'
import { useRoomsQuery } from '@/features/room/model/use-rooms'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import { ConfirmDialog } from '@/shared/ui/dialog'

const numberFmt = new Intl.NumberFormat('ko-KR')

type Tab = 'PAID' | 'REFUNDED' | 'ALL' | 'EXPIRING'

const TAB_LABEL: Record<Tab, string> = {
  PAID: '완납',
  REFUNDED: '환불',
  ALL: '전체',
  EXPIRING: '만료 임박',
}

const EXPIRING_WINDOW_DAYS = 10

function currentYear(): number {
  return new Date().getFullYear()
}

function todayLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function daysUntil(iso: string): number {
  const target = new Date(iso)
  const today = new Date()
  target.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function periodRange(year: number, month: number | null): { from: string; to: string } {
  if (month == null) {
    return {
      from: `${year}-01`,
      to: `${year}-12`,
    }
  }
  const mm = String(month).padStart(2, '0')
  return { from: `${year}-${mm}`, to: `${year}-${mm}` }
}

export function PaymentListPage() {
  const [year, setYear] = useState<number>(currentYear())
  const [month, setMonth] = useState<number | null>(null)
  const [tenantSearch, setTenantSearch] = useState<string>('')
  const [roomSearch, setRoomSearch] = useState<string>('')
  const [tab, setTab] = useState<Tab>('ALL')
  const [registerTarget, setRegisterTarget] = useState<RegisterPaymentTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentResponse | null>(null)
  const [extendTarget, setExtendTarget] = useState<{
    contract: ContractResponse
    tenantName: string
    roomNumber?: string
  } | null>(null)

  const { data: tenants = [] } = useTenantsQuery()
  const { data: rooms = [] } = useRoomsQuery()
  const { data: contracts = [] } = useContractsQuery()

  const { from, to } = periodRange(year, month)
  const paidStatus: PaymentStatus | undefined =
    tab === 'PAID' ? 'PAID' : tab === 'REFUNDED' ? 'REFUNDED' : undefined
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsQuery({
    fromPeriod: from,
    toPeriod: to,
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

  const expiringContracts = useMemo(() => {
    const qName = tenantSearch.trim().toLowerCase()
    const qRoom = roomSearch.trim().toLowerCase()
    return contracts
      .filter((c) => c.status === 'ACTIVE')
      .map((c) => ({ contract: c, days: daysUntil(c.endDate) }))
      .filter((x) => x.days <= EXPIRING_WINDOW_DAYS)
      .filter((x) => {
        if (qName) {
          const name = (tenantNameById[x.contract.tenantId] ?? '').toLowerCase()
          if (!name.includes(qName)) return false
        }
        if (qRoom) {
          const room = (roomNumberById[x.contract.roomId] ?? '').toLowerCase()
          if (!room.includes(qRoom)) return false
        }
        return true
      })
      .sort((a, b) => a.days - b.days)
  }, [contracts, tenantSearch, roomSearch, tenantNameById, roomNumberById])

  const filteredPayments = useMemo(() => {
    const qName = tenantSearch.trim().toLowerCase()
    const qRoom = roomSearch.trim().toLowerCase()
    if (!qName && !qRoom) return payments
    return payments.filter((p) => {
      const c = contractById[p.contractId]
      if (qName) {
        const name = c ? (tenantNameById[c.tenantId] ?? '').toLowerCase() : ''
        if (!name.includes(qName)) return false
      }
      if (qRoom) {
        const room = c ? (roomNumberById[c.roomId] ?? '').toLowerCase() : ''
        if (!room.includes(qRoom)) return false
      }
      return true
    })
  }, [payments, tenantSearch, roomSearch, contractById, tenantNameById, roomNumberById])

  const deleteMutation = useDeletePayment()

  const openRegisterForPaid = (p: PaymentResponse) => {
    const c = contractById[p.contractId]
    setRegisterTarget({
      contractId: p.contractId,
      periodYearMonth: p.periodYearMonth,
      defaultAmount: c?.monthlyRent ?? p.amount,
      tenantName: c ? tenantNameById[c.tenantId] : undefined,
      roomNumber: c ? roomNumberById[c.roomId] : undefined,
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // 에러는 mutation 의 isError 로 표시 — 닫지 않음
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-[-0.02em]">결제 관리</h1>
          <p className="text-xs text-[var(--muted)]">
            실제 발생한 결제(완납/환불)와 계약 만료 임박 건을 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <div className="inline-flex rounded-md border border-[var(--border)] bg-[var(--control)] p-0.5">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="rounded px-2 py-1 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--control-hover)]"
            >
              ← 전년
            </button>
            <button
              type="button"
              onClick={() => setYear(currentYear())}
              disabled={year === currentYear()}
              className="rounded px-2 py-1 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--control-hover)] disabled:cursor-default disabled:bg-[var(--accent)] disabled:text-white"
            >
              올해
            </button>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="rounded px-2 py-1 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--control-hover)]"
            >
              후년 →
            </button>
          </div>
          <label className="flex items-center gap-2">
            <span>연도</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || currentYear())}
              className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-1.5 text-sm tabular-nums text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>월</span>
            <select
              value={month ?? ''}
              onChange={(e) => setMonth(e.target.value === '' ? null : Number(e.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">전체</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>입주자</span>
            <input
              type="text"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              placeholder="이름 검색"
              className="w-28 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
            {tenantSearch ? (
              <button
                type="button"
                onClick={() => setTenantSearch('')}
                title="초기화"
                className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            ) : null}
          </label>
          <label className="flex items-center gap-2">
            <span>호수</span>
            <input
              type="text"
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              placeholder="예: 702"
              className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
            {roomSearch ? (
              <button
                type="button"
                onClick={() => setRoomSearch('')}
                title="초기화"
                className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            ) : null}
          </label>
        </div>
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
            {t === 'EXPIRING' && expiringContracts.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {expiringContracts.length}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === 'EXPIRING' ? (
        <ExpiringSection
          items={expiringContracts}
          tenantNameById={tenantNameById}
          roomNumberById={roomNumberById}
          onExtend={(c) =>
            setExtendTarget({
              contract: c,
              tenantName: tenantNameById[c.tenantId] ?? '입주자',
              roomNumber: roomNumberById[c.roomId],
            })
          }
        />
      ) : (
        <PaymentsSection
          loading={paymentsLoading}
          items={filteredPayments}
          tenantNameById={tenantNameById}
          roomNumberById={roomNumberById}
          contractById={contractById}
          onDelete={(p) => setDeleteTarget(p)}
          onRegisterAgain={openRegisterForPaid}
        />
      )}

      <RegisterPaymentDialog
        target={registerTarget}
        onClose={() => setRegisterTarget(null)}
      />
      <ExtendAndPayDialog
        contract={extendTarget?.contract ?? null}
        tenantName={extendTarget?.tenantName ?? ''}
        roomNumber={extendTarget?.roomNumber}
        onClose={() => setExtendTarget(null)}
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

function ExpiringSection({
  items,
  tenantNameById,
  roomNumberById,
  onExtend,
}: {
  items: { contract: ContractResponse; days: number }[]
  tenantNameById: Record<string, string>
  roomNumberById: Record<string, string>
  onExtend: (c: ContractResponse) => void
}) {
  if (items.length === 0) {
    return <EmptyState text={`D-${EXPIRING_WINDOW_DAYS} 이내 만료되는 계약이 없습니다. 👍`} />
  }
  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {items.map(({ contract, days }) => {
        const tenantName = tenantNameById[contract.tenantId] ?? '—'
        const roomNumber = roomNumberById[contract.roomId] ?? contract.roomId.slice(0, 6)
        const overdue = days < 0
        const badgeLabel = overdue
          ? `${-days}일 초과`
          : days === 0
            ? '오늘 만료'
            : `D-${days}`
        const badgeTone = overdue
          ? 'bg-rose-500 text-white'
          : days <= 3
            ? 'bg-rose-500/15 text-rose-600'
            : 'bg-amber-500/15 text-amber-600'
        return (
          <li
            key={contract.contractId}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{tenantName}</span>
                <span className="text-xs text-[var(--muted)]">{roomNumber}호</span>
                <span
                  className={[
                    'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    badgeTone,
                  ].join(' ')}
                >
                  {badgeLabel}
                </span>
              </div>
              <span className="text-xs text-[var(--muted)] tabular-nums">
                ~ {contract.endDate} · 월 {numberFmt.format(contract.monthlyRent)}원
              </span>
            </div>
            <button
              type="button"
              onClick={() => onExtend(contract)}
              className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              계약 연장
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PaymentsSection({
  loading,
  items,
  tenantNameById,
  roomNumberById,
  contractById,
  onDelete,
  onRegisterAgain,
}: {
  loading: boolean
  items: PaymentResponse[]
  tenantNameById: Record<string, string>
  roomNumberById: Record<string, string>
  contractById: Record<string, { tenantId: string; roomId: string }>
  onDelete: (p: PaymentResponse) => void
  onRegisterAgain: (p: PaymentResponse) => void
}) {
  if (loading) return <EmptyState text="불러오는 중…" />
  if (items.length === 0) {
    return <EmptyState text="표시할 결제 내역이 없습니다." />
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
                    {refunded ? (
                      <button
                        type="button"
                        onClick={() => onRegisterAgain(p)}
                        className="rounded-md border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--control-hover)]"
                      >
                        재등록
                      </button>
                    ) : null}
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
