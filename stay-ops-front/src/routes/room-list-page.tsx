import { useMemo, useState } from 'react'

import { useRoomsQuery } from '@/features/room/model/use-rooms'
import { RoomFloorView } from '@/features/room/ui/room-floor-view'
import {
  RoomSidebar,
  type RoomFilter,
} from '@/features/room/ui/room-sidebar'

type ViewMode = 'floor' | 'kanban' | 'table'

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'floor', label: '카드' },
  { id: 'kanban', label: '칸반' },
  { id: 'table', label: '테이블' },
]

export function RoomListPage() {
  const [view, setView] = useState<ViewMode>('floor')
  const [filter, setFilter] = useState<RoomFilter>({ floor: null, status: null })

  const { data = [], isLoading, isError, error } = useRoomsQuery()

  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filter.floor !== null && r.floor !== filter.floor) return false
      if (filter.status !== null && r.status !== filter.status) return false
      return true
    })
  }, [data, filter])

  return (
    <div className="-mx-4 -my-4 flex min-h-[calc(100svh-3.5rem)] md:-mx-6 md:-my-6">
      <RoomSidebar rooms={data} filter={filter} onChange={setFilter} />

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
          <RoomFloorView rooms={filtered} />
        ) : (
          <PlaceholderView
            label={VIEW_TABS.find((t) => t.id === view)?.label ?? ''}
          />
        )}
      </section>
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

function PlaceholderView({ label }: { label: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-24 text-sm text-[var(--muted)]">
      {label} 뷰 — 준비 중입니다
    </div>
  )
}
