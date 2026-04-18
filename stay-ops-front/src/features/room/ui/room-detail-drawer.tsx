import { useEffect, useState } from 'react'

import type { RoomResponse } from '@/features/room/api/room-api'
import { useChangeRoomStatus } from '@/features/room/model/use-change-room-status'
import { useDeleteRoom } from '@/features/room/model/use-delete-room'
import { useUpdateRoom } from '@/features/room/model/use-update-room'
import {
  ROOM_OPTION_LABEL,
  ROOM_STATUS_DOT,
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
  ROOM_TYPE_LABEL,
} from '@/features/room/model/room-types'
import { RoomForm } from '@/features/room/ui/room-form'
import { RoomStatusBadge } from '@/features/room/ui/room-status-badge'
import { ConfirmDialog } from '@/shared/ui/dialog'

const krw = new Intl.NumberFormat('ko-KR')
const dateFmt = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type Props = {
  room: RoomResponse | null
  onClose: () => void
}

type Mode = 'view' | 'edit'

export function RoomDetailDrawer({ room, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeleteRoom()
  const updateMutation = useUpdateRoom()

  // 다른 방으로 전환되면 view 모드로 리셋
  useEffect(() => {
    setMode('view')
  }, [room?.roomId])

  // ESC 로 닫기 — confirm 열려있거나 edit 모드면 drawer 닫히지 않음
  useEffect(() => {
    if (!room || confirmOpen || mode === 'edit') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [room, confirmOpen, mode, onClose])

  if (!room) return null

  const handleDelete = () => {
    deleteMutation.mutate(room.roomId, {
      onSuccess: () => {
        setConfirmOpen(false)
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="닫기"
        onClick={mode === 'edit' ? undefined : onClose}
        disabled={mode === 'edit'}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm disabled:cursor-default"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={`방 ${room.roomNumber} 상세`}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] shadow-[-20px_0_60px_rgba(0,0,0,0.2)]"
      >
        <Header room={room} onClose={onClose} mode={mode} />

        {mode === 'view' ? (
          <>
            <StatusSection room={room} />
            <InfoSection room={room} />
            <Footer
              onEdit={() => setMode('edit')}
              onDelete={() => setConfirmOpen(true)}
            />
          </>
        ) : (
          <section className="px-5 pb-5">
            <RoomForm
              initial={room}
              submitting={updateMutation.isPending}
              submitLabel="저장"
              onCancel={() => setMode('view')}
              onSubmit={async (payload) => {
                await updateMutation.mutateAsync(
                  { roomId: room.roomId, body: payload },
                  { onSuccess: () => setMode('view') },
                )
              }}
            />
          </section>
        )}
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (deleteMutation.isPending ? null : setConfirmOpen(false))}
        onConfirm={handleDelete}
        title={`${room.roomNumber}호를 삭제할까요?`}
        description="삭제 후 목록에서 즉시 사라집니다. 서버에는 soft delete 로 기록되어 복구 가능합니다."
        confirmLabel="삭제"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

/* ───── Header ───── */

function Header({
  room,
  onClose,
  mode,
}: {
  room: RoomResponse
  onClose: () => void
  mode: Mode
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            {room.roomNumber}
          </h2>
          <span className="text-sm text-[var(--muted)]">
            {mode === 'edit' ? '수정 중' : '호'}
          </span>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={mode === 'edit'}
        aria-label="닫기"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
      >
        ✕
      </button>
    </header>
  )
}

/* ───── Status change ───── */

function StatusSection({ room }: { room: RoomResponse }) {
  const mutation = useChangeRoomStatus()

  return (
    <section className="px-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        상태 변경
      </h3>
      <div className="flex flex-wrap gap-2">
        {ROOM_STATUS_ORDER.map((s) => {
          const active = room.status === s
          return (
            <button
              key={s}
              type="button"
              disabled={active || mutation.isPending}
              onClick={() =>
                mutation.mutate({ roomId: room.roomId, status: s })
              }
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'cursor-default border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--control)] text-[var(--foreground)] hover:border-[var(--accent)] disabled:opacity-60',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-1.5 w-1.5 rounded-full',
                  active ? 'bg-white' : ROOM_STATUS_DOT[s],
                ].join(' ')}
              />
              {ROOM_STATUS_LABEL[s]}
            </button>
          )
        })}
      </div>
      {mutation.isError ? (
        <p className="mt-2 text-xs text-rose-500">
          상태 변경 실패: {mutation.error instanceof Error ? mutation.error.message : '오류'}
        </p>
      ) : null}
    </section>
  )
}

/* ───── Info grid ───── */

function InfoSection({ room }: { room: RoomResponse }) {
  return (
    <section className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-4">
      <InfoRow label="층" value={`${room.floor}F`} />
      <InfoRow label="타입" value={ROOM_TYPE_LABEL[room.roomType]} />
      <InfoRow label="평수" value={`${Number(room.sizePyeong)}평`} />
      <InfoRow label="월세" value={`${krw.format(room.monthlyRent)}원`} />
      <InfoRow label="보증금" value={`${krw.format(room.deposit)}원`} />

      <div className="flex items-start justify-between gap-3 py-1.5">
        <span className="shrink-0 text-sm text-[var(--muted)]">옵션</span>
        {room.options.length === 0 ? (
          <span className="text-sm text-[var(--muted)]">—</span>
        ) : (
          <div className="flex flex-wrap justify-end gap-1">
            {room.options.map((o) => (
              <span
                key={o}
                className="inline-flex items-center rounded bg-[var(--control)] px-2 py-0.5 text-xs text-[var(--foreground)]"
              >
                {ROOM_OPTION_LABEL[o]}
              </span>
            ))}
          </div>
        )}
      </div>

      <InfoRow label="메모" value={room.memo ?? '—'} />

      <div className="mt-2 flex flex-col gap-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
        <div className="flex justify-between">
          <span>생성</span>
          <span>{dateFmt.format(new Date(room.createdAt))}</span>
        </div>
        <div className="flex justify-between">
          <span>업데이트</span>
          <span>{dateFmt.format(new Date(room.updatedAt))}</span>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">
        {value}
      </span>
    </div>
  )
}

/* ───── Footer ───── */

function Footer({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <footer className="mt-auto flex gap-2 border-t border-[var(--border)] px-5 py-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
      >
        수정
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10"
      >
        삭제
      </button>
    </footer>
  )
}
