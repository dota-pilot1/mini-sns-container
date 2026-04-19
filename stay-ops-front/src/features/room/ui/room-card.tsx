import type { RoomResponse } from '@/features/room/api/room-api'
import { RoomStatusBadge } from '@/features/room/ui/room-status-badge'

const krw = new Intl.NumberFormat('ko-KR')

type Props = {
  room: RoomResponse
  onClick?: (roomId: string) => void
}

export function RoomCard({ room, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(room.roomId)}
      className="group flex min-w-[9rem] flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left shadow-sm transition hover:border-[var(--accent)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div className="-mx-3 -mt-2.5 mb-0.5 aspect-[16/9] overflow-hidden rounded-t-xl bg-[var(--control)]">
        {room.primaryImageUrl ? (
          <img
            src={room.primaryImageUrl}
            alt={`${room.roomNumber}호 대표 이미지`}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--muted)]">
            이미지 없음
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold tracking-[-0.02em] text-[var(--foreground)]">
          {room.roomNumber}
        </span>
        <RoomStatusBadge status={room.status} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>{room.floor}F</span>
        <span>{room.sizePyeong}평</span>
      </div>
      <div className="text-xs font-medium text-[var(--foreground)]">
        월 {krw.format(room.monthlyRent)}원
      </div>
    </button>
  )
}
