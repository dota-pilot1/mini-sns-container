import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import type { TenantsSearch } from '@/app/router'
import { useRoomsQuery } from '@/features/room/model/use-rooms'
import type { TenantResponse } from '@/features/tenant/api/tenant-api'
import { useDeleteTenant } from '@/features/tenant/model/use-delete-tenant'
import { useHardDeleteTenant } from '@/features/tenant/model/use-hard-delete-tenant'
import { useRestoreTenant } from '@/features/tenant/model/use-restore-tenant'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import { TenantDetailDrawer } from '@/features/tenant/ui/tenant-detail-drawer'
import { TenantMoveInDialog } from '@/features/tenant/ui/tenant-move-in-dialog'
import type { UserResponse } from '@/features/user/api/user-api'
import { useUsersQuery } from '@/features/user/model/use-users'
import { ConfirmDialog } from '@/shared/ui/dialog'

const USER_PAGE_SIZE = 100

const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function TenantListPage() {
  const search = useSearch({ from: '/tenants' }) as TenantsSearch
  const navigate = useNavigate({ from: '/tenants' })

  const selectedTenantId = search.selected ?? null
  const [moveInUser, setMoveInUser] = useState<UserResponse | null>(null)
  const [moveOutTarget, setMoveOutTarget] = useState<TenantResponse | null>(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<TenantResponse | null>(null)

  const setSelected = useCallback(
    (tenantId: string | null) => {
      navigate({
        search: (prev) => ({ ...prev, selected: tenantId ?? undefined }),
        replace: true,
      })
    },
    [navigate],
  )

  const { data: userPage } = useUsersQuery({ page: 0, size: USER_PAGE_SIZE })
  const { data: rooms = [] } = useRoomsQuery()
  const { data: activeTenants = [], isLoading: activeLoading } = useTenantsQuery()
  const { data: deletedTenants = [], isLoading: deletedLoading } = useTenantsQuery({
    deletedOnly: true,
  })

  const restoreMutation = useRestoreTenant()
  const hardDeleteMutation = useHardDeleteTenant()
  const moveOutMutation = useDeleteTenant()

  const users = useMemo(() => userPage?.items ?? [], [userPage])
  const totalUsers = userPage?.totalElements ?? 0

  const roomNumberById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of rooms) map[r.roomId] = r.roomNumber
    return map
  }, [rooms])

  const occupiedRoomIds = useMemo(() => {
    const set = new Set<string>()
    for (const t of activeTenants) if (t.roomId) set.add(t.roomId)
    return set
  }, [activeTenants])

  const selectedTenant = useMemo(
    () =>
      selectedTenantId
        ? activeTenants.find((t) => t.tenantId === selectedTenantId) ?? null
        : null,
    [activeTenants, selectedTenantId],
  )

  return (
    <div className="-mx-4 -my-4 flex min-h-[calc(100svh-3.5rem)] flex-col gap-4 px-4 py-4 md:-mx-6 md:-my-6 md:px-6 md:py-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-[-0.03em]">입주자 관리</h1>
          <span className="text-xs text-[var(--muted)]">
            회원 {totalUsers.toLocaleString('ko-KR')} · 거주중 {activeTenants.length} · 퇴실{' '}
            {deletedTenants.length}
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <Column
          title="회원"
          subtitle="입주 희망자"
          count={users.length}
          totalCount={totalUsers}
          accent="sky"
        >
          {users.length === 0 ? (
            <Empty>회원이 없습니다.</Empty>
          ) : (
            users.map((u) => (
              <MemberCard key={u.userId} user={u} onMoveIn={() => setMoveInUser(u)} />
            ))
          )}
          {totalUsers > users.length ? (
            <p className="px-1 py-2 text-center text-xs text-[var(--muted)]">
              + {totalUsers - users.length}명 (최대 {USER_PAGE_SIZE}명 표시)
            </p>
          ) : null}
        </Column>

        <Column
          title="거주중"
          subtitle="현재 입주 중"
          count={activeTenants.length}
          accent="emerald"
        >
          {activeLoading ? (
            <SkeletonCards />
          ) : activeTenants.length === 0 ? (
            <Empty>거주중 인원이 없습니다.</Empty>
          ) : (
            activeTenants.map((t) => (
              <ActiveTenantCard
                key={t.tenantId}
                tenant={t}
                roomNumber={t.roomId ? roomNumberById[t.roomId] ?? null : null}
                onOpen={() => setSelected(t.tenantId)}
                onMoveOut={() => setMoveOutTarget(t)}
              />
            ))
          )}
        </Column>

        <Column
          title="퇴실"
          subtitle="복원 또는 완전 삭제 가능"
          count={deletedTenants.length}
          accent="slate"
        >
          {deletedLoading ? (
            <SkeletonCards />
          ) : deletedTenants.length === 0 ? (
            <Empty>퇴실 기록이 없습니다.</Empty>
          ) : (
            deletedTenants.map((t) => (
              <DeletedTenantCard
                key={t.tenantId}
                tenant={t}
                roomNumber={t.roomId ? roomNumberById[t.roomId] ?? null : null}
                restoring={restoreMutation.isPending && restoreMutation.variables === t.tenantId}
                onRestore={() => restoreMutation.mutate(t.tenantId)}
                onHardDelete={() => setHardDeleteTarget(t)}
              />
            ))
          )}
        </Column>
      </div>

      <TenantMoveInDialog
        user={moveInUser}
        rooms={rooms}
        occupiedRoomIds={occupiedRoomIds}
        onClose={() => setMoveInUser(null)}
      />

      <TenantDetailDrawer
        tenant={selectedTenant}
        rooms={rooms}
        onClose={() => setSelected(null)}
      />

      <ConfirmDialog
        open={moveOutTarget !== null}
        onClose={() =>
          moveOutMutation.isPending ? undefined : setMoveOutTarget(null)
        }
        onConfirm={() => {
          if (!moveOutTarget) return
          moveOutMutation.mutate(moveOutTarget.tenantId, {
            onSuccess: () => setMoveOutTarget(null),
          })
        }}
        title={`${moveOutTarget?.name ?? ''} 님을 퇴실 처리할까요?`}
        description="거주중 목록에서 퇴실 컬럼으로 이동합니다. 퇴실 컬럼에서 복원할 수 있습니다."
        confirmLabel="퇴실"
        variant="danger"
        loading={moveOutMutation.isPending}
      />

      <ConfirmDialog
        open={hardDeleteTarget !== null}
        onClose={() =>
          hardDeleteMutation.isPending ? undefined : setHardDeleteTarget(null)
        }
        onConfirm={() => {
          if (!hardDeleteTarget) return
          hardDeleteMutation.mutate(hardDeleteTarget.tenantId, {
            onSuccess: () => setHardDeleteTarget(null),
          })
        }}
        title={`${hardDeleteTarget?.name ?? ''} 님을 완전히 삭제할까요?`}
        description="DB 에서 영구 제거되며 복구할 수 없습니다."
        confirmLabel="완전 삭제"
        variant="danger"
        loading={hardDeleteMutation.isPending}
      />
    </div>
  )
}

/* ───── Column layout ───── */

const COLUMN_ACCENT: Record<'sky' | 'emerald' | 'slate', string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-400',
}

function Column({
  title,
  subtitle,
  count,
  totalCount,
  accent,
  children,
}: {
  title: string
  subtitle?: string
  count: number
  totalCount?: number
  accent: 'sky' | 'emerald' | 'slate'
  children: React.ReactNode
}) {
  return (
    <section className="flex min-h-[240px] flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <header className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={['h-2 w-2 rounded-full', COLUMN_ACCENT[accent]].join(' ')} />
          <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
          {subtitle ? (
            <span className="text-[11px] text-[var(--muted)]">· {subtitle}</span>
          ) : null}
        </div>
        <span className="text-xs tabular-nums text-[var(--muted)]">
          {totalCount !== undefined && totalCount !== count
            ? `${count} / ${totalCount}`
            : count}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">{children}</div>
    </section>
  )
}

/* ───── Cards ───── */

function MemberCard({
  user,
  onMoveIn,
}: {
  user: UserResponse
  onMoveIn: () => void
}) {
  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 transition hover:border-[var(--accent)]">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-[var(--muted)]">{user.email}</span>
        <span className="text-[11px] text-[var(--muted)]">
          {dateOnlyFmt.format(new Date(user.createdAt))} 가입
        </span>
      </div>
      <button
        type="button"
        onClick={onMoveIn}
        className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
      >
        입주
      </button>
    </div>
  )
}

function ActiveTenantCard({
  tenant,
  roomNumber,
  onOpen,
  onMoveOut,
}: {
  tenant: TenantResponse
  roomNumber: string | null
  onOpen: () => void
  onMoveOut: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] transition hover:border-[var(--accent)]">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-l-xl px-3 py-2.5 text-left"
      >
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{tenant.name}</span>
          <span className="truncate text-xs text-[var(--muted)]">{tenant.phoneNumber}</span>
        </div>
        <span className="shrink-0 rounded-md bg-[var(--control)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--muted)]">
          {roomNumber ? `${roomNumber}호` : '미배정'}
        </span>
      </button>
      <button
        type="button"
        onClick={onMoveOut}
        aria-label={`${tenant.name} 퇴실`}
        className="mr-2 shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/5 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10"
      >
        퇴실
      </button>
    </div>
  )
}

function DeletedTenantCard({
  tenant,
  roomNumber,
  restoring,
  onRestore,
  onHardDelete,
}: {
  tenant: TenantResponse
  roomNumber: string | null
  restoring: boolean
  onRestore: () => void
  onHardDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{tenant.name}</span>
          <span className="truncate text-xs text-[var(--muted)]">{tenant.phoneNumber}</span>
        </div>
        <span className="shrink-0 rounded-md bg-[var(--control)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--muted)]">
          {roomNumber ? `${roomNumber}호` : '미배정'}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
        >
          {restoring ? '복원 중…' : '복원'}
        </button>
        <button
          type="button"
          onClick={onHardDelete}
          className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10"
        >
          완전 삭제
        </button>
      </div>
    </div>
  )
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-strong)]"
        />
      ))}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-xs text-[var(--muted)]">
      {children}
    </div>
  )
}
