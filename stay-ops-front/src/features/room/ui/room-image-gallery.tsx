import { useRoomImagesQuery } from '@/features/room/model/use-room-images'
import { RoomImageDropzone } from '@/features/room/ui/room-image-dropzone'
import { RoomImageThumb } from '@/features/room/ui/room-image-thumb'

type Props = {
  roomId: string
  /** 드롭존 표시 여부. 읽기 전용 미리보기에서 끌 수 있음. */
  uploadEnabled?: boolean
}

export function RoomImageGallery({ roomId, uploadEnabled = true }: Props) {
  const { data: images = [], isLoading, isError, error } = useRoomImagesQuery(roomId)

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          이미지 {images.length > 0 ? <span className="text-[var(--muted)]">({images.length})</span> : null}
        </h3>
      </header>

      {uploadEnabled ? <RoomImageDropzone roomId={roomId} /> : null}

      {isLoading ? (
        <GallerySkeleton />
      ) : isError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">
          이미지를 불러오지 못했어요: {error instanceof Error ? error.message : '오류'}
        </p>
      ) : images.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-6 text-center text-xs text-[var(--muted)]">
          등록된 이미지가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
          {images.map((image, idx) => (
            <RoomImageThumb key={image.id} image={image} index={idx} />
          ))}
        </div>
      )}
    </section>
  )
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-lg border border-[var(--border)] bg-[var(--control)]"
        />
      ))}
    </div>
  )
}
