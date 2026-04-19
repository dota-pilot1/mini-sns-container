import { useEffect, useMemo, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { useDeleteContract } from '@/features/contract/model/use-delete-contract'
import { AddContractDialog } from '@/features/contract/ui/add-contract-dialog'
import { CancelOccupancyDialog } from '@/features/contract/ui/cancel-occupancy-dialog'
import { ContractHistoryDialog } from '@/features/contract/ui/contract-history-dialog'
import { ExtendAndPayDialog } from '@/features/contract/ui/extend-and-pay-dialog'
import type { PaymentResponse } from '@/features/payment/api/payment-api'
import { useDeletePayment } from '@/features/payment/model/use-delete-payment'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'
import {
  RegisterPaymentDialog,
  type RegisterPaymentTarget,
} from '@/features/payment/ui/register-payment-dialog'
import type { TenantResponse } from '@/features/tenant/api/tenant-api'
import { useDeleteTenant } from '@/features/tenant/model/use-delete-tenant'
import { useUpdateTenant } from '@/features/tenant/model/use-update-tenant'
import { TenantForm } from '@/features/tenant/ui/tenant-form'
import { ConfirmDialog } from '@/shared/ui/dialog'

function thisMonthString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const dateFmt = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })
const numberFmt = new Intl.NumberFormat('ko-KR')

type Props = {
  tenant: TenantResponse | null
  contracts: ContractResponse[]
  roomNumberById: Record<string, string>
  onClose: () => void
}

type Mode = 'view' | 'edit'

export function TenantDetailDrawer({
  tenant,
  contracts,
  roomNumberById,
  onClose,
}: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [terminateTarget, setTerminateTarget] = useState<ContractResponse | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [registerTarget, setRegisterTarget] = useState<RegisterPaymentTarget | null>(null)
  const [deleteContractTarget, setDeleteContractTarget] = useState<ContractResponse | null>(null)
  const [addContractOpen, setAddContractOpen] = useState(false)
  const [extendTarget, setExtendTarget] = useState<ContractResponse | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const deleteMutation = useDeleteTenant()
  const updateMutation = useUpdateTenant()
  const deleteContractMutation = useDeleteContract()
  const deletePaymentMutation = useDeletePayment()

  useEffect(() => {
    setMode('view')
  }, [tenant?.tenantId])

  useEffect(() => {
    if (!tenant || terminateTarget || deleteOpen || mode === 'edit') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tenant, terminateTarget, deleteOpen, mode, onClose])

  const tenantContracts = useMemo(
    () =>
      tenant
        ? contracts
            .filter((c) => c.tenantId === tenant.tenantId)
            .slice()
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
        : [],
    [contracts, tenant],
  )

  const activeContract = tenantContracts.find((c) => c.status === 'ACTIVE') ?? null

  const period = thisMonthString()
  const { data: monthPayments = [] } = usePaymentsQuery(
    activeContract ? { contractId: activeContract.contractId, period } : {},
    { enabled: !!activeContract },
  )

  const occupiedRoomIds = useMemo(() => {
    const set = new Set<string>()
    for (const c of contracts) if (c.status === 'ACTIVE') set.add(c.roomId)
    return set
  }, [contracts])

  if (!tenant) return null

  const thisMonthPaid = activeContract
    ? monthPayments.find((p) => p.status === 'PAID') ?? null
    : null
  const thisMonthRefunded = activeContract
    ? monthPayments.some((p) => p.status === 'REFUNDED' && !thisMonthPaid)
    : false

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="닫기"
        onClick={mode === 'edit' ? undefined : onClose}
        disabled={mode === 'edit'}
        className="absolute inset-0 bg-[var(--backdrop)] disabled:cursor-default"
      />

      <aside
        role="dialog"
        aria-label={`입주자 ${tenant.name} 상세`}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] shadow-[-20px_0_60px_rgba(0,0,0,0.2)]"
      >
        <Header tenant={tenant} onClose={onClose} mode={mode} />

        {mode === 'view' ? (
          <>
            <InfoSection
              tenant={tenant}
              activeContract={activeContract}
              activeRoomNumber={activeContract ? roomNumberById[activeContract.roomId] : undefined}
              period={period}
              thisMonthPaid={thisMonthPaid}
              thisMonthRefundedOnly={thisMonthRefunded}
            />
            <ContractsSection
              contracts={tenantContracts}
              roomNumberById={roomNumberById}
              monthPayments={monthPayments}
              period={period}
              onTerminate={setTerminateTarget}
              onDeleteContract={setDeleteContractTarget}
              onAdd={() => setAddContractOpen(true)}
              onExtend={() => {
                if (activeContract) setExtendTarget(activeContract)
              }}
              onOpenHistory={() => setHistoryOpen(true)}
              onRegisterPayment={(c) => {
                const roomNumber = roomNumberById[c.roomId]
                setRegisterTarget({
                  contractId: c.contractId,
                  periodYearMonth: period,
                  defaultAmount: c.monthlyRent,
                  tenantName: tenant.name,
                  roomNumber,
                })
              }}
              onUndoPayment={(payment) => {
                if (
                  window.confirm(
                    `${payment.periodYearMonth} 결제 기록을 삭제할까요? (잘못 등록한 건 교정용)`,
                  )
                ) {
                  deletePaymentMutation.mutate(payment.id)
                }
              }}
            />
            <Footer
              activeContract={activeContract}
              onEdit={() => setMode('edit')}
              onTerminate={() => {
                if (activeContract) setTerminateTarget(activeContract)
              }}
              onDelete={() => setDeleteOpen(true)}
            />
          </>
        ) : (
          <section className="px-5 pb-5">
            <TenantForm
              initial={tenant}
              submitting={updateMutation.isPending}
              submitLabel="저장"
              onCancel={() => setMode('view')}
              onSubmit={async (payload) => {
                await updateMutation.mutateAsync(
                  { tenantId: tenant.tenantId, body: payload },
                  { onSuccess: () => setMode('view') },
                )
              }}
            />
          </section>
        )}
      </aside>

      <CancelOccupancyDialog
        contract={terminateTarget}
        tenantName={tenant.name}
        roomNumber={
          terminateTarget ? roomNumberById[terminateTarget.roomId] : undefined
        }
        onClose={() => setTerminateTarget(null)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => (deleteMutation.isPending ? undefined : setDeleteOpen(false))}
        onConfirm={() => {
          deleteMutation.mutate(tenant.tenantId, {
            onSuccess: () => {
              setDeleteOpen(false)
              onClose()
            },
          })
        }}
        title={`${tenant.name} 님을 완전 삭제할까요?`}
        description="입주자 정보와 모든 계약 이력이 DB 에서 영구 제거됩니다. 복구 불가."
        confirmLabel="완전 삭제"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <RegisterPaymentDialog
        target={registerTarget}
        onClose={() => setRegisterTarget(null)}
      />

      <ConfirmDialog
        open={deleteContractTarget !== null}
        onClose={() =>
          deleteContractMutation.isPending ? undefined : setDeleteContractTarget(null)
        }
        onConfirm={() => {
          if (!deleteContractTarget) return
          deleteContractMutation.mutate(deleteContractTarget.contractId, {
            onSuccess: () => setDeleteContractTarget(null),
          })
        }}
        title="이 계약을 완전 삭제할까요?"
        description={
          deleteContractTarget
            ? `${roomNumberById[deleteContractTarget.roomId] ?? '계약'}호 · ${deleteContractTarget.startDate} ~ ${deleteContractTarget.endDate} · 결제 내역도 함께 삭제됩니다. 잘못 입력한 계약 복구용으로만 사용하세요.`
            : undefined
        }
        confirmLabel="삭제"
        variant="danger"
        loading={deleteContractMutation.isPending}
      />

      <AddContractDialog
        tenantId={addContractOpen ? tenant.tenantId : null}
        tenantName={tenant.name}
        occupiedRoomIds={occupiedRoomIds}
        onClose={() => setAddContractOpen(false)}
      />

      <ExtendAndPayDialog
        contract={extendTarget}
        tenantName={tenant.name}
        roomNumber={extendTarget ? roomNumberById[extendTarget.roomId] : undefined}
        onClose={() => setExtendTarget(null)}
      />

      <ContractHistoryDialog
        open={historyOpen}
        tenantName={tenant.name}
        contracts={tenantContracts}
        roomNumberById={roomNumberById}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}

function Header({
  tenant,
  onClose,
  mode,
}: {
  tenant: TenantResponse
  onClose: () => void
  mode: Mode
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">{tenant.name}</h2>
        {mode === 'edit' ? (
          <span className="text-sm text-[var(--muted)]">수정 중</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={mode === 'edit'}
        aria-label="닫기"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
      >
        ✕
      </button>
    </header>
  )
}

function InfoSection({
  tenant,
  activeContract,
  activeRoomNumber,
  period,
  thisMonthPaid,
  thisMonthRefundedOnly,
}: {
  tenant: TenantResponse
  activeContract: ContractResponse | null
  activeRoomNumber?: string
  period: string
  thisMonthPaid: PaymentResponse | null
  thisMonthRefundedOnly: boolean
}) {
  return (
    <section className="flex flex-col gap-2 px-5 py-2">
      <InfoRow label="연락처" value={tenant.phoneNumber} />
      <InfoRow label="메모" value={tenant.memo ?? '—'} />

      <div className="flex items-start justify-between gap-3 py-1.5">
        <span className="shrink-0 text-sm text-[var(--muted)]">현재 상태</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {activeContract ? (
            <>
              <StatusPill tone="emerald">
                거주중{activeRoomNumber ? ` · ${activeRoomNumber}호` : ''}
              </StatusPill>
              {thisMonthPaid ? (
                <StatusPill tone="emerald">{period} 완납</StatusPill>
              ) : thisMonthRefundedOnly ? (
                <StatusPill tone="amber">{period} 환불됨</StatusPill>
              ) : (
                <StatusPill tone="rose">{period} 미납</StatusPill>
              )}
            </>
          ) : (
            <StatusPill tone="slate">퇴실</StatusPill>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
        <div className="flex justify-between">
          <span>생성</span>
          <span>{dateFmt.format(new Date(tenant.createdAt))}</span>
        </div>
        <div className="flex justify-between">
          <span>업데이트</span>
          <span>{dateFmt.format(new Date(tenant.updatedAt))}</span>
        </div>
      </div>
    </section>
  )
}

function StatusPill({
  tone,
  children,
}: {
  tone: 'emerald' | 'rose' | 'amber' | 'slate'
  children: React.ReactNode
}) {
  const cls = {
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    slate: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  }[tone]
  return (
    <span className={['rounded-full px-2 py-0.5 text-[10px] font-semibold', cls].join(' ')}>
      {children}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-sm text-[var(--muted)]">{label}</span>
      <span className="break-words text-right text-sm font-medium text-[var(--foreground)]">
        {value}
      </span>
    </div>
  )
}

function ContractsSection({
  contracts,
  roomNumberById,
  monthPayments,
  period,
  onTerminate,
  onDeleteContract,
  onAdd,
  onExtend,
  onOpenHistory,
  onRegisterPayment,
  onUndoPayment,
}: {
  contracts: ContractResponse[]
  roomNumberById: Record<string, string>
  monthPayments: PaymentResponse[]
  period: string
  onTerminate: (c: ContractResponse) => void
  onDeleteContract: (c: ContractResponse) => void
  onAdd: () => void
  onExtend: () => void
  onOpenHistory: () => void
  onRegisterPayment: (c: ContractResponse) => void
  onUndoPayment: (p: PaymentResponse) => void
}) {
  const hasActive = contracts.some((c) => c.status === 'ACTIVE')
  const latest = contracts[0] ?? null
  const hasHistory = contracts.length > 1

  return (
    <section className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            계약
          </h3>
          {hasHistory ? (
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label={`계약 이력 ${contracts.length}건 보기`}
              title={`계약 이력 ${contracts.length}건 보기`}
              className="flex h-5 items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--control)] px-1.5 text-[10px] font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 fill-current">
                <rect x="2" y="3" width="12" height="1.5" rx="0.5" />
                <rect x="2" y="7.25" width="12" height="1.5" rx="0.5" />
                <rect x="2" y="11.5" width="12" height="1.5" rx="0.5" />
              </svg>
              <span className="tabular-nums">{contracts.length}</span>
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {hasActive ? (
            <button
              type="button"
              onClick={onExtend}
              className="rounded-md border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
            >
              계약 연장
            </button>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-md border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
            >
              + 새 계약
            </button>
          )}
        </div>
      </div>
      {!latest ? (
        <p className="text-xs text-[var(--muted)]">계약 없음</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {[latest].map((c) => {
            const isActive = c.status === 'ACTIVE'
            const monthPaid = isActive
              ? monthPayments.find(
                  (p) => p.contractId === c.contractId && p.status === 'PAID',
                ) ?? null
              : null
            return (
              <li
                key={c.contractId}
                className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {roomNumberById[c.roomId] ? `${roomNumberById[c.roomId]}호` : c.roomId.slice(0, 8)}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--muted)]">
                    {formatRelativeContract(c.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>
                    {dateOnlyFmt.format(new Date(c.startDate))} ~{' '}
                    {dateOnlyFmt.format(new Date(c.endDate))}
                  </span>
                  <span className="tabular-nums">월 {numberFmt.format(c.monthlyRent)}원</span>
                </div>
                {isActive ? (
                  <label className="mt-1 flex items-center justify-between gap-2 rounded-md bg-[var(--control)] px-2 py-1.5 text-[11px]">
                    <span className="text-[var(--muted)]">{period} 입금</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={[
                          'font-semibold',
                          monthPaid ? 'text-emerald-600' : 'text-rose-500',
                        ].join(' ')}
                      >
                        {monthPaid ? '완납' : '미납'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!monthPaid}
                        onClick={() => {
                          if (monthPaid) {
                            onUndoPayment(monthPaid)
                          } else {
                            onRegisterPayment(c)
                          }
                        }}
                        className={[
                          'relative inline-flex h-5 w-9 items-center rounded-full transition',
                          monthPaid ? 'bg-emerald-500' : 'bg-[var(--border)]',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
                            monthPaid ? 'translate-x-4' : 'translate-x-0.5',
                          ].join(' ')}
                        />
                      </button>
                    </span>
                  </label>
                ) : null}
                <div className="flex justify-end gap-1.5 pt-1">
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => onTerminate(c)}
                      className="rounded-md border border-rose-500/40 bg-rose-500/5 px-2 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-500/10"
                    >
                      계약 취소
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onDeleteContract(c)}
                    className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:border-rose-500/40 hover:text-rose-500"
                  >
                    삭제
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** 계약 시작일 기준 상대 시간 라벨. "오늘 계약" / "N일 전 계약" / "N개월 전 계약" / "N년 전 계약". */
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

function Footer({
  activeContract,
  onEdit,
  onTerminate,
  onDelete,
}: {
  activeContract: ContractResponse | null
  onEdit: () => void
  onTerminate: () => void
  onDelete: () => void
}) {
  return (
    <footer className="mt-auto flex flex-wrap gap-2 border-t border-[var(--border)] px-5 py-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
      >
        수정
      </button>
      {activeContract ? (
        <button
          type="button"
          onClick={onTerminate}
          className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10"
        >
          계약 취소
        </button>
      ) : (
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10"
        >
          완전 삭제
        </button>
      )}
    </footer>
  )
}
