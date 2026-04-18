import { useEffect, useRef, useState } from 'react'

import { useChangeRoomStatus } from '@/features/room/model/use-change-room-status'
import { useDeleteRoom } from '@/features/room/model/use-delete-room'
import {
  ROOM_STATUS_DOT,
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
  type RoomStatus,
} from '@/features/room/model/room-types'
import { ConfirmDialog } from '@/shared/ui/dialog'

type Props = {
  selectedIds: string[]
  onClear: () => void
}

/**
 * 테이블에서 선택된 방에 대한 일괄 작업 바.
 * - 상태 변경: 순차 mutation (낙관적 업데이트 충돌 방지)
 * - 삭제: ConfirmDialog 후 순차 mutation
 * - 진행 중엔 버튼 비활성 + 진행도 표시
 */
export function RoomBulkActionBar({ selectedIds, onClear }: Props) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const changeStatus = useChangeRoomStatus()
  const deleteRoom = useDeleteRoom()

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!statusMenuOpen) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [statusMenuOpen])

  const running = progress !== null

  const applyStatusToAll = async (status: RoomStatus) => {
    setStatusMenuOpen(false)
    setProgress({ done: 0, total: selectedIds.length })
    for (let i = 0; i < selectedIds.length; i++) {
      try {
        await changeStatus.mutateAsync({ roomId: selectedIds[i], status })
      } catch {
        // 각 mutation 은 자체 onError 에서 롤백. 전체 순회는 계속 진행.
      }
      setProgress({ done: i + 1, total: selectedIds.length })
    }
    setProgress(null)
    onClear()
  }

  const deleteAll = async () => {
    setProgress({ done: 0, total: selectedIds.length })
    for (let i = 0; i < selectedIds.length; i++) {
      try {
        await deleteRoom.mutateAsync(selectedIds[i])
      } catch {
        // ignore, keep going
      }
      setProgress({ done: i + 1, total: selectedIds.length })
    }
    setProgress(null)
    setConfirmDeleteOpen(false)
    onClear()
  }

  return (
    <>
      <div className="sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        <span className="text-sm font-semibold">
          {progress
            ? `${progress.done} / ${progress.total} 처리 중…`
            : `${selectedIds.length}개 선택됨`}
        </span>

        {/* 상태 변경 드롭다운 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            disabled={running}
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--control)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-50"
          >
            상태 변경 ▾
          </button>
          {statusMenuOpen ? (
            <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
              {ROOM_STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applyStatusToAll(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--control)]"
                >
                  <span
                    className={[
                      'inline-block h-1.5 w-1.5 rounded-full',
                      ROOM_STATUS_DOT[s],
                    ].join(' ')}
                  />
                  {ROOM_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={running}
          onClick={() => setConfirmDeleteOpen(true)}
          className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50"
        >
          삭제
        </button>

        <button
          type="button"
          disabled={running}
          onClick={onClear}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-50"
        >
          해제
        </button>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => (running ? undefined : setConfirmDeleteOpen(false))}
        onConfirm={deleteAll}
        title={`선택된 ${selectedIds.length}개 방을 삭제할까요?`}
        description="삭제 후 목록에서 즉시 사라집니다. 서버에는 soft delete 로 기록되어 복구 가능합니다."
        confirmLabel="모두 삭제"
        variant="danger"
        loading={running}
      />
    </>
  )
}
