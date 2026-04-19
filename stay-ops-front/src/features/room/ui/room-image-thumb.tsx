import { useState } from 'react'

import type { RoomImage } from '@/features/room/model/room-image-types'
import { useDeleteRoomImage } from '@/features/room/model/use-delete-room-image'
import { useSetPrimaryRoomImage } from '@/features/room/model/use-set-primary-room-image'
import { ConfirmDialog } from '@/shared/ui/dialog'

type Props = {
  image: RoomImage
  index: number
}

export function RoomImageThumb({ image, index }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const setPrimaryMutation = useSetPrimaryRoomImage()
  const deleteMutation = useDeleteRoomImage()

  const handleSetPrimary = () => {
    if (image.primary) return
    setPrimaryMutation.mutate({ roomId: image.roomId, imageId: image.id })
  }

  const handleDelete = () => {
    deleteMutation.mutate(
      { roomId: image.roomId, imageId: image.id },
      { onSuccess: () => setConfirmOpen(false) },
    )
  }

  return (
    <>
      <figure className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--control)]">
        <img
          src={image.url}
          alt={`이미지 ${index + 1}${image.primary ? ' (대표)' : ''}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {image.primary ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            대표
          </span>
        ) : null}

        <div className="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          {!image.primary ? (
            <button
              type="button"
              onClick={handleSetPrimary}
              disabled={setPrimaryMutation.isPending}
              title="대표 이미지로 지정"
              className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-900 shadow transition hover:bg-white disabled:opacity-60"
            >
              대표로 지정
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            title="삭제"
            className="rounded-md bg-rose-500/95 px-2 py-1 text-[10px] font-medium text-white shadow transition hover:bg-rose-600"
          >
            삭제
          </button>
        </div>
      </figure>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (deleteMutation.isPending ? null : setConfirmOpen(false))}
        onConfirm={handleDelete}
        title="이 이미지를 삭제할까요?"
        description={image.primary ? '대표 이미지입니다. 삭제 시 다른 이미지가 자동으로 대표로 승격됩니다.' : '삭제 후 복구할 수 없습니다.'}
        confirmLabel="삭제"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </>
  )
}
