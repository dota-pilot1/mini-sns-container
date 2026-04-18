import { useMemo } from 'react'

import type { RoomResponse } from '@/features/room/api/room-api'
import {
  ROOM_STATUS_DOT,
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
  type RoomStatus,
} from '@/features/room/model/room-types'
import { RoomCard } from '@/features/room/ui/room-card'

type Props = {
  rooms: RoomResponse[]
  onSelect?: (roomId: string) => void
}

export function RoomKanbanView({ rooms, onSelect }: Props) {
  const grouped = useMemo(() => {
    const out: Record<RoomStatus, RoomResponse[]> = {
      VACANT: [],
      RESERVED: [],
      OCCUPIED: [],
      CLEANING: [],
      MAINTENANCE: [],
    }
    for (const r of rooms) out[r.status].push(r)
    for (const s of ROOM_STATUS_ORDER) {
      out[s].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    }
    return out
  }, [rooms])

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {ROOM_STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          rooms={grouped[status]}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function KanbanColumn({
  status,
  rooms,
  onSelect,
}: {
  status: RoomStatus
  rooms: RoomResponse[]
  onSelect?: (roomId: string) => void
}) {
  return (
    <section className="flex min-w-[15rem] flex-1 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
      <header className="flex items-center gap-2 px-1 py-1">
        <span
          className={[
            'inline-block h-2 w-2 rounded-full',
            ROOM_STATUS_DOT[status],
          ].join(' ')}
        />
        <h3 className="text-sm font-semibold tracking-[-0.01em]">
          {ROOM_STATUS_LABEL[status]}
        </h3>
        <span className="ml-auto rounded-full bg-[var(--control)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
          {rooms.length}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {rooms.length === 0 ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-[var(--border)] py-8 text-xs text-[var(--muted)]">
            없음
          </div>
        ) : (
          rooms.map((room) => (
            <RoomCard key={room.roomId} room={room} onClick={onSelect} />
          ))
        )}
      </div>
    </section>
  )
}
