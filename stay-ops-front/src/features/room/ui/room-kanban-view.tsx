import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'

import type { RoomResponse } from '@/features/room/api/room-api'
import { useChangeRoomStatus } from '@/features/room/model/use-change-room-status'
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
  const [activeRoom, setActiveRoom] = useState<RoomResponse | null>(null)
  const changeStatus = useChangeRoomStatus()

  // 포인터 8px 이동 후 드래그 시작 — 클릭(= 상세 열기)과 드래그를 구분
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

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

  const handleDragStart = (e: DragStartEvent) => {
    const roomId = e.active.id as string
    const room = rooms.find((r) => r.roomId === roomId) ?? null
    setActiveRoom(room)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveRoom(null)
    const over = e.over
    if (!over) return
    const roomId = e.active.id as string
    const targetStatus = over.id as RoomStatus
    const room = rooms.find((r) => r.roomId === roomId)
    if (!room || room.status === targetStatus) return
    changeStatus.mutate({ roomId, status: targetStatus })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

      <DragOverlay dropAnimation={null}>
        {activeRoom ? (
          <div className="rotate-1 opacity-90 shadow-xl">
            <RoomCard room={activeRoom} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
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
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      className={[
        'flex min-w-[15rem] flex-1 flex-col gap-2 rounded-xl border p-2 transition',
        isOver
          ? 'border-[var(--accent)] bg-[var(--control)]'
          : 'border-[var(--border)] bg-[var(--surface)]',
      ].join(' ')}
    >
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
            {isOver ? '여기에 놓기' : '없음'}
          </div>
        ) : (
          rooms.map((room) => (
            <DraggableRoomCard
              key={room.roomId}
              room={room}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </section>
  )
}

function DraggableRoomCard({
  room,
  onSelect,
}: {
  room: RoomResponse
  onSelect?: (roomId: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: room.roomId,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={[
        'touch-none transition',
        isDragging ? 'opacity-30' : 'opacity-100',
      ].join(' ')}
    >
      <RoomCard room={room} onClick={onSelect} />
    </div>
  )
}
