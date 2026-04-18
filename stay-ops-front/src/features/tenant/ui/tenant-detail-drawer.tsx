import { useEffect, useState } from 'react'

import type { RoomResponse } from '@/features/room/api/room-api'
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

type Props = {
  tenant: TenantResponse | null
  rooms: RoomResponse[]
  onClose: () => void
}

type Mode = 'view' | 'edit'

export function TenantDetailDrawer({ tenant, rooms, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const moveOutMutation = useDeleteTenant()
  const updateMutation = useUpdateTenant()

  useEffect(() => {
    setMode('view')
  }, [tenant?.tenantId])

  useEffect(() => {
    if (!tenant || confirmOpen || mode === 'edit') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tenant, confirmOpen, mode, onClose])

  if (!tenant) return null

  const roomNumber = tenant.roomId
    ? rooms.find((r) => r.roomId === tenant.roomId)?.roomNumber
    : null

  const handleMoveOut = () => {
    moveOutMutation.mutate(tenant.tenantId, {
      onSuccess: () => {
        setConfirmOpen(false)
        onClose()
      },
    })
  }

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
            <InfoSection tenant={tenant} roomNumber={roomNumber ?? null} />
            <Footer
              onEdit={() => setMode('edit')}
              onMoveOut={() => setConfirmOpen(true)}
            />
          </>
        ) : (
          <section className="px-5 pb-5">
            <TenantForm
              initial={tenant}
              rooms={rooms}
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
        open={confirmOpen}
        onClose={() => (moveOutMutation.isPending ? null : setConfirmOpen(false))}
        onConfirm={handleMoveOut}
        title={`${tenant.name} 님을 퇴실 처리할까요?`}
        description="거주중 목록에서 퇴실 컬럼으로 이동합니다. 퇴실 컬럼에서 복원할 수 있습니다."
        confirmLabel="퇴실"
        variant="danger"
        loading={moveOutMutation.isPending}
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
  roomNumber,
}: {
  tenant: TenantResponse
  roomNumber: string | null
}) {
  return (
    <section className="flex flex-col gap-2 px-5 py-2">
      <InfoRow label="연락처" value={tenant.phoneNumber} />
      <InfoRow label="방" value={roomNumber ? `${roomNumber}호` : '—'} />
      <InfoRow
        label="입실일"
        value={tenant.moveInDate ? dateOnlyFmt.format(new Date(tenant.moveInDate)) : '—'}
      />
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

function Footer({
  onEdit,
  onMoveOut,
}: {
  onEdit: () => void
  onMoveOut: () => void
}) {
  return (
    <footer className="mt-auto flex gap-2 border-t border-[var(--border)] px-5 py-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
      >
        수정
      </button>
      <button
        type="button"
        onClick={onMoveOut}
        className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10"
      >
        퇴실
      </button>
    </footer>
  )
}
