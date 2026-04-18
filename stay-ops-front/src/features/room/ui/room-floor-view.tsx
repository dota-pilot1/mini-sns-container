import type { RoomResponse } from '@/features/room/api/room-api'
import { RoomCard } from '@/features/room/ui/room-card'

export function RoomFloorView({ rooms }: { rooms: RoomResponse[] }) {
  const byFloor = groupByFloor(rooms)
  const floors = Object.keys(byFloor)
    .map(Number)
    .sort((a, b) => b - a) // 높은 층이 위

  if (floors.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-sm text-[var(--muted)]">
        등록된 방이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {floors.map((floor) => (
        <section key={floor} className="flex flex-col gap-2">
          <h2 className="flex items-baseline gap-2 text-sm font-semibold text-[var(--foreground)]">
            <span className="rounded-md bg-[var(--control)] px-2 py-0.5 text-[var(--muted)]">
              {floor}F
            </span>
            <span className="text-xs font-normal text-[var(--muted)]">
              {byFloor[floor].length}개
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
            {byFloor[floor].map((room) => (
              <RoomCard key={room.roomId} room={room} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function groupByFloor(rooms: RoomResponse[]): Record<number, RoomResponse[]> {
  const out: Record<number, RoomResponse[]> = {}
  for (const r of rooms) {
    if (!out[r.floor]) out[r.floor] = []
    out[r.floor].push(r)
  }
  for (const k of Object.keys(out)) {
    out[Number(k)].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
  }
  return out
}
