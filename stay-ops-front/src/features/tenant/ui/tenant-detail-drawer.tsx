import { useEffect, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { CONTRACT_STATUS_LABEL } from '@/features/contract/model/contract-types'
import { useTerminateContract } from '@/features/contract/model/use-terminate-contract'
import { RecentPaymentsSection } from '@/features/payment/ui/recent-payments-section'
import type { TenantResponse } from '@/features/tenant/api/tenant-api'
import { useDeleteTenant } from '@/features/tenant/model/use-delete-tenant'
import { useUpdateTenant } from '@/features/tenant/model/use-update-tenant'
import { TenantForm } from '@/features/tenant/ui/tenant-form'
import { ConfirmDialog } from '@/shared/ui/dialog'

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

  const terminateMutation = useTerminateContract()
  const deleteMutation = useDeleteTenant()
  const updateMutation = useUpdateTenant()

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

  if (!tenant) return null

  const tenantContracts = contracts
    .filter((c) => c.tenantId === tenant.tenantId)
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  const activeContract = tenantContracts.find((c) => c.status === 'ACTIVE') ?? null

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
            <InfoSection tenant={tenant} />
            {activeContract ? (
              <div className="px-5">
                <RecentPaymentsSection contractId={activeContract.contractId} />
              </div>
            ) : null}
            <ContractsSection
              contracts={tenantContracts}
              roomNumberById={roomNumberById}
              onTerminate={setTerminateTarget}
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

      <ConfirmDialog
        open={terminateTarget !== null}
        onClose={() =>
          terminateMutation.isPending ? undefined : setTerminateTarget(null)
        }
        onConfirm={() => {
          if (!terminateTarget) return
          terminateMutation.mutate(
            { contractId: terminateTarget.contractId },
            { onSuccess: () => setTerminateTarget(null) },
          )
        }}
        title={`${tenant.name} 님을 퇴실 처리할까요?`}
        description="계약 상태가 TERMINATED 로 변경되며 거주중 목록에서 제거됩니다. 언제든 새 계약을 만들어 재입주시킬 수 있습니다."
        confirmLabel="퇴실"
        variant="danger"
        loading={terminateMutation.isPending}
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

function InfoSection({ tenant }: { tenant: TenantResponse }) {
  return (
    <section className="flex flex-col gap-2 px-5 py-2">
      <InfoRow label="연락처" value={tenant.phoneNumber} />
      <InfoRow label="메모" value={tenant.memo ?? '—'} />

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
  onTerminate,
}: {
  contracts: ContractResponse[]
  roomNumberById: Record<string, string>
  onTerminate: (c: ContractResponse) => void
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        계약 이력 ({contracts.length})
      </h3>
      {contracts.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">계약 없음</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {contracts.map((c) => (
            <li
              key={c.contractId}
              className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {roomNumberById[c.roomId] ? `${roomNumberById[c.roomId]}호` : c.roomId.slice(0, 8)}
                </span>
                <StatusChip status={c.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>
                  {dateOnlyFmt.format(new Date(c.startDate))} ~{' '}
                  {dateOnlyFmt.format(new Date(c.endDate))}
                </span>
                <span className="tabular-nums">월 {numberFmt.format(c.monthlyRent)}원</span>
              </div>
              {c.status === 'ACTIVE' ? (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onTerminate(c)}
                    className="rounded-md border border-rose-500/40 bg-rose-500/5 px-2 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-500/10"
                  >
                    이 계약 종료
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function StatusChip({ status }: { status: ContractResponse['status'] }) {
  const cls =
    status === 'ACTIVE'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : status === 'TERMINATED'
        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
        : 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
  return (
    <span className={['rounded-md px-2 py-0.5 text-[10px] font-semibold', cls].join(' ')}>
      {CONTRACT_STATUS_LABEL[status]}
    </span>
  )
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
          퇴실
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
