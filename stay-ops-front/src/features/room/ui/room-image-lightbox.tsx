import { useCallback, useEffect, useState } from 'react'

import type { RoomImage } from '@/features/room/model/room-image-types'

type Props = {
  images: RoomImage[]
  startIndex: number
  onClose: () => void
}

/** 전체 화면 이미지 라이트박스. ESC 로 닫고, ←/→ 로 순환. */
export function RoomImageLightbox({ images, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0)),
  )

  const total = images.length
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total],
  )
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && total > 1) {
        e.preventDefault()
        prev()
      } else if (e.key === 'ArrowRight' && total > 1) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next, total])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  if (total === 0) return null
  const current = images[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 미리보기"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
      >
        ✕
      </button>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="이전"
            className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="다음"
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ›
          </button>
        </>
      ) : null}

      <img
        key={current.id}
        src={current.url}
        alt={`이미지 ${index + 1}${current.primary ? ' (대표)' : ''}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain"
      />

      {total > 1 ? (
        <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/70 tabular-nums">
          {index + 1} / {total}
        </div>
      ) : null}
    </div>
  )
}
