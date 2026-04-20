import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import type { TenantsSearch } from '@/app/router'
import type { ContractResponse } from '@/features/contract/api/contract-api'
import {
  deriveContractState,
  isCancelled,
  isEffective,
  isOverdue,
} from '@/features/contract/model/contract-types'
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
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'

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
  /** EFFECTIVE 이면 false, UPCOMING only 면 true. */
  upcoming: boolean
}

type OverdueEntry = {
  tenant: TenantResponse
  contract: ContractResponse
  roomNumber: string | null
}

type MovedOutEntry = {
  tenant: TenantResponse
  lastContract: ContractResponse | null
  roomNumber: string | null
}

const DDAY_FILTER_OPTIONS = [
  { value: null as number | null, label: '전체' },
  { value: 7, label: 'D-7' },
  { value: 10, label: 'D-10' },
  { value: 30, label: 'D-30' },
]

/** 오늘부터 iso 까지 남은 일수. 음수면 이미 지남. */
function daysUntil(iso: string): number {
  const end = new Date(iso)
  const today = new Date()
  end.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function TenantListPage() {
  const search = useSearch({ from: '/tenants' }) as TenantsSearch
  const navigate = useNavigate({ from: '/tenants' })

  const selectedTenantId = search.selected ?? null
  const [moveInUser, setMoveInUser] = useState<UserResponse | null>(null)
  const [terminateTarget, setTerminateTarget] = useState<{
    tenant: TenantResponse
    contract: ContractResponse
    roomNumber: string | null
  } | null>(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<MovedOutEntry | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  /** 거주중 컬럼 D-day 필터. null 이면 전체, 숫자면 "오늘부터 N일 이내 만료" 만 표시. */
  const [activeDdayFilter, setActiveDdayFilter] = useState<number | null>(null)

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

  /**
   * 우선순위로 분류 — 한 tenant 는 한 컬럼에만 등장.
   * EFFECTIVE > UPCOMING > OVERDUE > (모두 CANCELLED 이거나 계약 없음)
   */
  const { activeEntries, overdueEntries, movedOutEntries } = useMemo(() => {
    const active: ActiveEntry[] = []
    const overdue: OverdueEntry[] = []
    const movedOut: MovedOutEntry[] = []
    for (const tenant of tenants) {
      const tc = contractsByTenant.get(tenant.tenantId) ?? []
      const effective = tc.find((c) => isEffective(c))
      if (effective) {
        active.push({
          tenant,
          contract: effective,
          roomNumber: roomNumberById[effective.roomId] ?? null,
          upcoming: false,
        })
        continue
      }
      const upcoming = tc.find((c) => deriveContractState(c) === 'UPCOMING')
      if (upcoming) {
        active.push({
          tenant,
          contract: upcoming,
          roomNumber: roomNumberById[upcoming.roomId] ?? null,
          upcoming: true,
        })
        continue
      }
      const overdueContract = tc.find((c) => isOverdue(c))
      if (overdueContract) {
        overdue.push({
          tenant,
          contract: overdueContract,
          roomNumber: roomNumberById[overdueContract.roomId] ?? null,
        })
        continue
      }
      // 모든 계약이 CANCELLED 이거나 계약 자체 없음 → 퇴실
      const last = tc.find((c) => isCancelled(c)) ?? tc[0] ?? null
      movedOut.push({
        tenant,
        lastContract: last,
        roomNumber: last ? roomNumberById[last.roomId] ?? null : null,
      })
    }
    const sortByRoom = <T extends { roomNumber: string | null }>(a: T, b: T) => {
      if (a.roomNumber === null && b.roomNumber === null) return 0
      if (a.roomNumber === null) return 1
      if (b.roomNumber === null) return -1
      return a.roomNumber.localeCompare(b.roomNumber)
    }
    active.sort(sortByRoom)
    overdue.sort(sortByRoom)
    return { activeEntries: active, overdueEntries: overdue, movedOutEntries: movedOut }
  }, [tenants, contractsByTenant, roomNumberById])

  const occupiedRoomIds = useMemo(() => {
    const set = new Set<string>()
    for (const e of activeEntries) set.add(e.contract.roomId)
    return set
  }, [activeEntries])

  const filteredActiveEntries = useMemo(() => {
    if (activeDdayFilter === null) return activeEntries
    return activeEntries.filter((e) => {
      // UPCOMING 은 아직 시작도 안 했으니 만료 임박 필터에서 제외
      if (e.upcoming) return false
      const d = daysUntil(e.contract.endDate)
      return d >= 0 && d <= activeDdayFilter
    })
  }, [activeEntries, activeDdayFilter])

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
            회원 {users.length} · 거주중 {activeEntries.length} · 연체{' '}
            {overdueEntries.length} · 퇴실 {movedOutEntries.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="분류 기준 안내"
          title="분류 기준 안내"
          className="inline-flex h-7 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--control)] px-3 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
        >
          <span className="font-semibold">?</span>
          분류 기준
        </button>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              이미 입주한 {hiddenUsers}명은 거주중/연체/퇴실 컬럼에서 확인
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
          subtitle="EFFECTIVE · 예정 포함"
          count={filteredActiveEntries.length}
          totalCount={activeEntries.length}
          accent="emerald"
          toolbar={
            <div className="flex items-center gap-1">
              {DDAY_FILTER_OPTIONS.map((opt) => {
                const active = activeDdayFilter === opt.value
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setActiveDdayFilter(opt.value)}
                    className={[
                      'rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition',
                      active
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[var(--border)] bg-[var(--control)] text-[var(--muted)] hover:border-emerald-500/60',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          }
        >
          {loading ? (
            <SkeletonCards />
          ) : filteredActiveEntries.length === 0 ? (
            <Empty>
              {activeDdayFilter !== null
                ? `D-${activeDdayFilter} 이내 만료 예정 없음.`
                : '거주중 인원이 없습니다.'}
            </Empty>
          ) : (
            filteredActiveEntries.map((e) => (
              <ActiveTenantCard
                key={e.tenant.tenantId}
                entry={e}
                onOpen={() => setSelected(e.tenant.tenantId)}
                onTerminate={() =>
                  setTerminateTarget({
                    tenant: e.tenant,
                    contract: e.contract,
                    roomNumber: e.roomNumber,
                  })
                }
              />
            ))
          )}
        </Column>

        <Column
          title="연체"
          subtitle="계약 만료 · 퇴실 처리 대기"
          count={overdueEntries.length}
          accent="rose"
        >
          {loading ? (
            <SkeletonCards />
          ) : overdueEntries.length === 0 ? (
            <Empty>연체 인원이 없습니다.</Empty>
          ) : (
            overdueEntries.map((e) => (
              <OverdueTenantCard
                key={e.tenant.tenantId}
                entry={e}
                onOpen={() => setSelected(e.tenant.tenantId)}
                onCheckOut={() =>
                  setTerminateTarget({
                    tenant: e.tenant,
                    contract: e.contract,
                    roomNumber: e.roomNumber,
                  })
                }
              />
            ))
          )}
        </Column>

        <Column
          title="퇴실"
          subtitle="CANCELLED"
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
        chain={
          terminateTarget
            ? (contractsByTenant.get(terminateTarget.tenant.tenantId) ?? []).filter(
                (c) => c.roomId === terminateTarget.contract.roomId,
              )
            : null
        }
        initialContractId={terminateTarget?.contract.contractId}
        tenantName={terminateTarget?.tenant.name ?? ''}
        roomNumber={terminateTarget?.roomNumber ?? undefined}
        onClose={() => setTerminateTarget(null)}
        onDone={() => setTerminateTarget(null)}
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

      <ClassificationHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

/* ───── Classification Help Dialog ───── */

function ClassificationHelpDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} ariaLabel="분류 기준 안내" maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">분류 기준</h2>
          <p className="text-xs text-[var(--muted)]">
            입주자 관리 4개 컬럼이 어떤 기준으로 분류되는지
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

      <div className="flex flex-col gap-3 px-5 py-4 text-sm">
        <HelpRow
          dot="bg-sky-500"
          title="회원"
          caption="입주 희망자"
          rule="User 테이블에 가입했지만 아직 Tenant 레코드가 없는 사람."
          note="입주 버튼으로 Tenant 생성 + 첫 계약 발급 → 거주중 컬럼으로 이동."
        />
        <HelpRow
          dot="bg-emerald-500"
          title="거주중"
          caption="EFFECTIVE · 예정 포함"
          rule="오늘 날짜가 startDate ~ endDate 사이인 계약(EFFECTIVE) 이 있거나, 아직 시작 안 한 예정 계약(UPCOMING) 만 있는 경우."
          note="예정만 있는 입주자는 카드에 '예정 D-N' 배지로 구분. 헤더 D-7/10/30 토글로 만료 임박자만 필터링."
        />
        <HelpRow
          dot="bg-rose-500"
          title="연체"
          caption="계약 만료 · 퇴실 처리 대기"
          rule="가장 최근 계약의 endDate 가 오늘보다 이전이지만, 관리자가 아직 퇴실 처리(cancelledAt 세팅) 하지 않은 상태."
          note="자연 만료로는 자동으로 퇴실되지 않음 — 관리자가 '퇴실 처리' 눌러야 CANCELLED 로 전환. 보증금 환불이 주 작업."
        />
        <HelpRow
          dot="bg-slate-400"
          title="퇴실"
          caption="CANCELLED"
          rule="모든 계약이 cancelledAt 세팅됨 (관리자가 명시적으로 퇴실 처리 완료)."
          note="이력 보존을 위해 레코드는 남음. 완전 삭제는 개별 카드의 '완전 삭제' 버튼."
        />
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--control)] px-5 py-3 text-[11px] text-[var(--muted)]">
        각 tenant 는 우선순위(EFFECTIVE → UPCOMING → OVERDUE → CANCELLED)에 따라 한 컬럼에만 등장합니다.
      </div>
    </Dialog>
  )
}

function HelpRow({
  dot,
  title,
  caption,
  rule,
  note,
}: {
  dot: string
  title: string
  caption: string
  rule: string
  note: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className={['h-2 w-2 shrink-0 translate-y-[3px] rounded-full', dot].join(' ')} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-[11px] text-[var(--muted)]">· {caption}</span>
      </div>
      <p className="pl-4 text-xs text-[var(--foreground)]">{rule}</p>
      <p className="pl-4 text-[11px] text-[var(--muted)]">{note}</p>
    </div>
  )
}

/* ───── Column layout ───── */

const COLUMN_ACCENT: Record<'sky' | 'emerald' | 'rose' | 'slate', string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
}

function Column({
  title,
  subtitle,
  count,
  totalCount,
  accent,
  toolbar,
  children,
}: {
  title: string
  subtitle?: string
  count: number
  totalCount?: number
  accent: 'sky' | 'emerald' | 'rose' | 'slate'
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex min-h-[240px] flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
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
        </div>
        {toolbar}
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
  const { tenant, contract, roomNumber, upcoming } = entry
  const daysLeft = daysUntil(contract.endDate)
  const daysToStart = daysUntil(contract.startDate)
  // D-day 색상: 임박(≤7)은 rose, 여유(≤30)는 amber, 아니면 muted
  const ddayTone =
    !upcoming && daysLeft <= 7
      ? 'text-rose-600'
      : !upcoming && daysLeft <= 30
        ? 'text-amber-600'
        : 'text-[var(--muted)]'
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] transition hover:border-[var(--accent)]">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-l-xl px-3 py-2.5 text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-medium">{tenant.name}</span>
            {upcoming ? (
              <span
                className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600"
                title={`입주 시작까지 ${daysToStart}일`}
              >
                예정 D-{daysToStart}
              </span>
            ) : (
              <span
                className={[
                  'shrink-0 text-[11px] font-medium tabular-nums',
                  ddayTone,
                ].join(' ')}
                title={`계약 만료까지 ${daysLeft}일`}
              >
                D-{daysLeft}
              </span>
            )}
          </span>
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

function OverdueTenantCard({
  entry,
  onOpen,
  onCheckOut,
}: {
  entry: OverdueEntry
  onOpen: () => void
  onCheckOut: () => void
}) {
  const { tenant, contract, roomNumber } = entry
  const overdueDays = Math.max(
    0,
    Math.round(
      (Date.now() - new Date(contract.endDate).getTime()) / (1000 * 60 * 60 * 24),
    ),
  )
  return (
    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 transition hover:border-rose-500">
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
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate text-[var(--muted)]">{tenant.phoneNumber}</span>
          <span className="tabular-nums font-medium text-rose-600">
            만료 +{overdueDays}일
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onCheckOut}
        aria-label={`${tenant.name} 퇴실 처리`}
        className="mr-2 shrink-0 rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-600"
      >
        퇴실 처리
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
