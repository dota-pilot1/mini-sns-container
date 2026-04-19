import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import type { TenantsSearch } from '@/app/router'
import type { ContractResponse } from '@/features/contract/api/contract-api'
import { isEffective } from '@/features/contract/model/contract-types'
import { useContractsQuery } from '@/features/contract/model/use-contracts'
import { CancelOccupancyDialog } from '@/features/contract/ui/cancel-occupancy-dialog'
import { useRoomsQuery } from '@/features/room/model/use-rooms'
import type { TenantResponse } from '@/features/tenant/api/tenant-api'
import { useDeleteTenant } from '@/features/tenant/model/use-delete-tenant'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import { TenantDetailDrawer } from '@/features/tenant/ui/tenant-detail-drawer'
import { TenantMoveInDialog } from '@/features/tenant/ui/tenant-move-in-dialog'
import type { UserResponse } from '@/features/user/api/user-api'
import { useUsersQuery } from '@/features/user/model/use-users'
import { ConfirmDialog } from '@/shared/ui/dialog'

const USER_PAGE_SIZE = 100
const numberFmt = new Intl.NumberFormat('ko-KR')
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type ActiveEntry = {
  tenant: TenantResponse
  contract: ContractResponse
  roomNumber: string | null
}

type MovedOutEntry = {
  tenant: TenantResponse
  lastContract: ContractResponse | null
  roomNumber: string | null
}

export function TenantListPage() {
  const search = useSearch({ from: '/tenants' }) as TenantsSearch
  const navigate = useNavigate({ from: '/tenants' })

  const selectedTenantId = search.selected ?? null
  const [moveInUser, setMoveInUser] = useState<UserResponse | null>(null)
  const [terminateTarget, setTerminateTarget] = useState<ActiveEntry | null>(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<MovedOutEntry | null>(null)

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
  const { data: tenants = [], isLoading: tenantsLoading } = useTenantsQuery()
  const { data: contracts = [], isLoading: contractsLoading } = useContractsQuery()

  const hardDeleteMutation = useDeleteTenant()

  const allUsers = useMemo(() => userPage?.items ?? [], [userPage])
  const totalUsersRaw = userPage?.totalElements ?? 0

  const roomNumberById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of rooms) map[r.roomId] = r.roomNumber
    return map
  }, [rooms])

  /** 이미 입주자로 등록된 User id 집합 — 회원 컬럼에서 숨긴다. */
  const tenantUserIdSet = useMemo(() => {
    const set = new Set<string>()
    for (const t of tenants) if (t.userId) set.add(t.userId)
    return set
  }, [tenants])

  const users = useMemo(
    () => allUsers.filter((u) => !tenantUserIdSet.has(u.userId)),
    [allUsers, tenantUserIdSet],
  )
  const hiddenUsers = allUsers.length - users.length

  /** tenantId → contracts, newest first. */
  const contractsByTenant = useMemo(() => {
    const map = new Map<string, ContractResponse[]>()
    for (const c of contracts) {
      const list = map.get(c.tenantId) ?? []
      list.push(c)
      map.set(c.tenantId, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.startDate.localeCompare(a.startDate))
    }
    return map
  }, [contracts])

  const activeEntries = useMemo<ActiveEntry[]>(() => {
    const list: ActiveEntry[] = []
    for (const tenant of tenants) {
      const tc = contractsByTenant.get(tenant.tenantId) ?? []
      const active = tc.find((c) => isEffective(c))
      if (active) {
        list.push({
          tenant,
          contract: active,
          roomNumber: roomNumberById[active.roomId] ?? null,
        })
      }
    }
    // 호실 오름차순 (방 미상은 맨 뒤)
    return list.sort((a, b) => {
      if (a.roomNumber === null && b.roomNumber === null) return 0
      if (a.roomNumber === null) return 1
      if (b.roomNumber === null) return -1
      return a.roomNumber.localeCompare(b.roomNumber)
    })
  }, [tenants, contractsByTenant, roomNumberById])

  const movedOutEntries = useMemo<MovedOutEntry[]>(() => {
    const list: MovedOutEntry[] = []
    for (const tenant of tenants) {
      const tc = contractsByTenant.get(tenant.tenantId) ?? []
      if (tc.some((c) => isEffective(c))) continue
      const last = tc[0] ?? null
      list.push({
        tenant,
        lastContract: last,
        roomNumber: last ? roomNumberById[last.roomId] ?? null : null,
      })
    }
    return list
  }, [tenants, contractsByTenant, roomNumberById])

  const occupiedRoomIds = useMemo(() => {
    const set = new Set<string>()
    for (const e of activeEntries) set.add(e.contract.roomId)
    return set
  }, [activeEntries])

  const selectedTenant = useMemo(
    () =>
      selectedTenantId
        ? tenants.find((t) => t.tenantId === selectedTenantId) ?? null
        : null,
    [tenants, selectedTenantId],
  )

  const loading = tenantsLoading || contractsLoading

  return (
    <div className="-mx-4 -my-4 flex min-h-[calc(100svh-3.5rem)] flex-col gap-4 px-4 py-4 md:-mx-6 md:-my-6 md:px-6 md:py-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-[-0.03em]">입주자 관리</h1>
          <span className="text-xs text-[var(--muted)]">
            회원 {users.length} · 거주중 {activeEntries.length} · 퇴실{' '}
            {movedOutEntries.length}
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <Column
          title="회원"
          subtitle="입주 희망자"
          count={users.length}
          accent="sky"
        >
          {users.length === 0 ? (
            <Empty>입주 가능한 회원이 없습니다.</Empty>
          ) : (
            users.map((u) => (
              <MemberCard key={u.userId} user={u} onMoveIn={() => setMoveInUser(u)} />
            ))
          )}
          {hiddenUsers > 0 ? (
            <p className="px-1 py-2 text-center text-[11px] text-[var(--muted)]">
              이미 입주한 {hiddenUsers}명은 거주중 컬럼에서 확인
            </p>
          ) : null}
          {totalUsersRaw > allUsers.length ? (
            <p className="px-1 pb-2 text-center text-[11px] text-[var(--muted)]">
              + {totalUsersRaw - allUsers.length}명 (최대 {USER_PAGE_SIZE}명 표시)
            </p>
          ) : null}
        </Column>

        <Column
          title="거주중"
          subtitle="ACTIVE 계약 보유"
          count={activeEntries.length}
          accent="emerald"
        >
          {loading ? (
            <SkeletonCards />
          ) : activeEntries.length === 0 ? (
            <Empty>거주중 인원이 없습니다.</Empty>
          ) : (
            activeEntries.map((e) => (
              <ActiveTenantCard
                key={e.tenant.tenantId}
                entry={e}
                onOpen={() => setSelected(e.tenant.tenantId)}
                onTerminate={() => setTerminateTarget(e)}
              />
            ))
          )}
        </Column>

        <Column
          title="퇴실"
          subtitle="활성 계약 없음"
          count={movedOutEntries.length}
          accent="slate"
        >
          {loading ? (
            <SkeletonCards />
          ) : movedOutEntries.length === 0 ? (
            <Empty>퇴실 이력이 없습니다.</Empty>
          ) : (
            movedOutEntries.map((e) => (
              <MovedOutCard
                key={e.tenant.tenantId}
                entry={e}
                onOpen={() => setSelected(e.tenant.tenantId)}
                onHardDelete={() => setHardDeleteTarget(e)}
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
        contracts={contracts}
        roomNumberById={roomNumberById}
        onClose={() => setSelected(null)}
      />

      <CancelOccupancyDialog
        contract={terminateTarget?.contract ?? null}
        tenantName={terminateTarget?.tenant.name ?? ''}
        roomNumber={terminateTarget?.roomNumber ?? undefined}
        onClose={() => setTerminateTarget(null)}
      />

      <ConfirmDialog
        open={hardDeleteTarget !== null}
        onClose={() =>
          hardDeleteMutation.isPending ? undefined : setHardDeleteTarget(null)
        }
        onConfirm={() => {
          if (!hardDeleteTarget) return
          hardDeleteMutation.mutate(hardDeleteTarget.tenant.tenantId, {
            onSuccess: () => setHardDeleteTarget(null),
          })
        }}
        title={`${hardDeleteTarget?.tenant.name ?? ''} 님을 완전히 삭제할까요?`}
        description="모든 계약 이력이 함께 DB 에서 제거되며 복구할 수 없습니다."
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 transition hover:border-[var(--accent)]">
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
  entry,
  onOpen,
  onTerminate,
}: {
  entry: ActiveEntry
  onOpen: () => void
  onTerminate: () => void
}) {
  const { tenant, contract, roomNumber } = entry
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] transition hover:border-[var(--accent)]">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-l-xl px-3 py-2.5 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium">{tenant.name}</span>
          <span className="shrink-0 rounded-md bg-[var(--control)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--muted)]">
            {roomNumber ? `${roomNumber}호` : '방 미상'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span className="truncate">{tenant.phoneNumber}</span>
          <span className="tabular-nums">월 {numberFmt.format(contract.monthlyRent)}원</span>
        </div>
      </button>
      <button
        type="button"
        onClick={onTerminate}
        aria-label={`${tenant.name} 계약 취소`}
        className="mr-2 shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/5 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10"
      >
        계약 취소
      </button>
    </div>
  )
}

function MovedOutCard({
  entry,
  onOpen,
  onHardDelete,
}: {
  entry: MovedOutEntry
  onOpen: () => void
  onHardDelete: () => void
}) {
  const { tenant, lastContract, roomNumber } = entry
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col gap-0.5 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium">{tenant.name}</span>
          <span className="shrink-0 rounded-md bg-[var(--control)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--muted)]">
            {roomNumber ? `${roomNumber}호` : '—'}
          </span>
        </div>
        <span className="truncate text-xs text-[var(--muted)]">{tenant.phoneNumber}</span>
        {lastContract ? (
          <span className="text-[11px] text-[var(--muted)]">
            마지막 계약 {dateOnlyFmt.format(new Date(lastContract.endDate))}
          </span>
        ) : null}
      </button>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onHardDelete}
          className="rounded-lg border border-rose-500/40 bg-rose-500/5 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10"
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
