import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import type { RoomsSearch } from '@/app/router'
import { useRoomPaymentStatusMap } from '@/features/payment/model/use-room-payment-status'
import type { RoomStatus } from '@/features/room/model/room-types'
import { useRoomsQuery } from '@/features/room/model/use-rooms'
import { RoomCreateModal } from '@/features/room/ui/room-create-modal'
import { RoomDetailDrawer } from '@/features/room/ui/room-detail-drawer'
import { RoomFloorView } from '@/features/room/ui/room-floor-view'
import { RoomKanbanView } from '@/features/room/ui/room-kanban-view'
import {
  RoomSidebar,
  type RoomFilter,
} from '@/features/room/ui/room-sidebar'
import { RoomTableView } from '@/features/room/ui/room-table-view'

type ViewMode = 'floor' | 'kanban' | 'table'

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'floor', label: '카드' },
  { id: 'kanban', label: '칸반' },
  { id: 'table', label: '테이블' },
]

export function RoomListPage() {
  const search = useSearch({ from: '/rooms' }) as RoomsSearch
  const navigate = useNavigate({ from: '/rooms' })
  const [createOpen, setCreateOpen] = useState(false)

  const view: ViewMode = search.view ?? 'floor'
  const filter: RoomFilter = {
    floor: search.floor ?? null,
    status: search.status ?? null,
  }
  const selectedRoomId = search.selected ?? null

  /** prev 를 받아 partial patch — undefined 로 두면 URL 에서 제거. */
  const patchSearch = useCallback(
    (patch: Partial<RoomsSearch>) => {
      navigate({
        search: (prev) => ({ ...prev, ...patch }),
        replace: true,
      })
    },
    [navigate],
  )

  const setView = (next: ViewMode) =>
    patchSearch({ view: next === 'floor' ? undefined : next })
  const setFilter = (next: RoomFilter) =>
    patchSearch({
      floor: next.floor ?? undefined,
      status: next.status ?? undefined,
    })
  const setSelected = (roomId: string | null) =>
    patchSearch({ selected: roomId ?? undefined })

  const { data = [], isLoading, isError, error } = useRoomsQuery()
  const { data: paymentStatusByRoomId, period: paymentPeriod } = useRoomPaymentStatusMap()

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filter.floor !== null && r.floor !== filter.floor) return false
      if (filter.status !== null && r.status !== filter.status) return false
      return true
    })
  }, [data, filter])

  const selectedRoom = useMemo(
    () => (selectedRoomId ? data.find((r) => r.roomId === selectedRoomId) ?? null : null),
    [data, selectedRoomId],
  )

  return (
    <div className="-mx-4 -my-4 flex min-h-[calc(100svh-3.5rem)] md:-mx-6 md:-my-6">
      <RoomSidebar
        rooms={data}
        filter={filter}
        onChange={setFilter}
        onCreateClick={() => setCreateOpen(true)}
      />

      <section className="flex flex-1 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold tracking-[-0.03em]">방 관리</h1>
            <span className="text-xs text-[var(--muted)]">
              {filter.floor === null && filter.status === null
                ? `총 ${data.length}개`
                : `${filtered.length} / ${data.length}개`}
            </span>
          </div>

          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--control)] p-1">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={[
                  'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition',
                  view === tab.id
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : '알 수 없는 오류'}
          />
        ) : view === 'floor' ? (
          <RoomFloorView
            rooms={filtered}
            paymentStatusByRoomId={paymentStatusByRoomId}
            paymentPeriod={paymentPeriod}
            onSelect={setSelected}
          />
        ) : view === 'table' ? (
          <RoomTableView
            rooms={filtered}
            paymentStatusByRoomId={paymentStatusByRoomId}
            paymentPeriod={paymentPeriod}
            onSelect={setSelected}
          />
        ) : (
          <RoomKanbanView
            rooms={filtered}
            paymentStatusByRoomId={paymentStatusByRoomId}
            paymentPeriod={paymentPeriod}
            onSelect={setSelected}
          />
        )}
      </section>

      <RoomDetailDrawer
        room={selectedRoom}
        onClose={() => setSelected(null)}
      />

      <RoomCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(roomId) => setSelected(roomId)}
      />
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]"
        />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 px-4 py-6 text-sm text-rose-600">
      방 목록을 불러오지 못했어요: {message}
    </div>
  )
}

// Export for type narrowing elsewhere if needed
export type { ViewMode }

// RoomStatus 는 sidebar filter 내부에서도 쓰이지만 타입 참조가 필요해서 re-export
export type { RoomStatus }
