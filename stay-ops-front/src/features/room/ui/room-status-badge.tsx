import { ROOM_STATUS_LABEL, type RoomStatus } from '@/features/room/model/room-types'
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill'

const TONE: Record<RoomStatus, StatusTone> = {
  VACANT: 'emerald',
  RESERVED: 'amber',
  OCCUPIED: 'sky',
  CLEANING: 'slate',
  MAINTENANCE: 'rose',
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return <StatusPill tone={TONE[status]}>{ROOM_STATUS_LABEL[status]}</StatusPill>
}
