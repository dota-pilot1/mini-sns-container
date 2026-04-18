import {
  ROOM_STATUS_BADGE,
  ROOM_STATUS_LABEL,
  type RoomStatus,
} from '@/features/room/model/room-types'

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        ROOM_STATUS_BADGE[status],
      ].join(' ')}
    >
      {ROOM_STATUS_LABEL[status]}
    </span>
  )
}
