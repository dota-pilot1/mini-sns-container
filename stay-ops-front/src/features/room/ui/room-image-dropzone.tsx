import { useCallback, useRef, useState } from 'react'

import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/features/room/model/room-image-types'
import { useUploadRoomImage } from '@/features/room/model/use-upload-room-image'

type Props = {
  roomId: string
}

type UploadState =
  | { phase: 'idle' }
  | { phase: 'uploading'; total: number; done: number; failed: number }

export function RoomImageDropzone({ roomId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [errors, setErrors] = useState<string[]>([])
  const uploadMutation = useUploadRoomImage()

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      if (files.length === 0) return

      setErrors([])
      setState({ phase: 'uploading', total: files.length, done: 0, failed: 0 })

      const results = await Promise.allSettled(
        files.map((file) =>
          uploadMutation.mutateAsync({ roomId, file }),
        ),
      )

      const nextErrors: string[] = []
      let done = 0
      let failed = 0
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          done += 1
        } else {
          failed += 1
          const msg = r.reason instanceof Error ? r.reason.message : '알 수 없는 오류'
          nextErrors.push(`${files[i].name}: ${msg}`)
        }
      })

      setErrors(nextErrors)
      setState({ phase: 'idle' })
      setState((prev) => prev) // trigger re-render; not strictly needed
      if (done + failed > 0) {
        // 완료 상태는 idle 로 되돌리고 요약은 에러 목록/토스트로 대체
      }
    },
    [roomId, uploadMutation],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const onClick = () => inputRef.current?.click()
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const isUploading = state.phase === 'uploading'

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={isUploading ? undefined : onClick}
        onKeyDown={isUploading ? undefined : onKey}
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragOver) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-disabled={isUploading}
        className={[
          'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
          isUploading
            ? 'cursor-default border-[var(--border)] bg-[var(--control)] opacity-80'
            : dragOver
              ? 'cursor-copy border-[var(--accent)] bg-[var(--accent)]/5'
              : 'cursor-pointer border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]',
        ].join(' ')}
      >
        {isUploading ? (
          <>
            <span className="text-sm font-medium">
              업로드 중… ({state.done + state.failed} / {state.total})
            </span>
            <span className="text-xs text-[var(--muted)]">완료될 때까지 페이지를 유지해 주세요.</span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-[var(--foreground)]">
              이미지를 드래그하거나 클릭해서 업로드
            </span>
            <span className="text-xs text-[var(--muted)]">
              JPG · PNG · WEBP · GIF / 최대 {MAX_UPLOAD_BYTES / 1024 / 1024}MB / 여러 장 동시 가능
            </span>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {errors.length > 0 ? (
        <ul className="flex flex-col gap-0.5 rounded-md border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
