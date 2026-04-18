import { type PropsWithChildren, useEffect, useRef } from 'react'

type DialogProps = PropsWithChildren<{
  open: boolean
  onClose: () => void
  ariaLabel: string
  /** 다이어로그 최대 너비. 기본 max-w-md. */
  maxWidth?: string
  /** 배경 클릭으로 닫기 여부 (폼에서 실수 방지용 false). 기본 true. */
  closeOnBackdrop?: boolean
}>

/**
 * 재사용 공용 다이어로그. 확인창/폼/알림에 모두 사용.
 * - ESC 닫기
 * - 배경 클릭 닫기 (closeOnBackdrop=false 로 끌 수 있음)
 * - 포커스 트랩은 미구현(MVP) — @radix-ui/react-dialog 도입 시 교체 고려
 */
export function Dialog({
  open,
  onClose,
  ariaLabel,
  maxWidth = 'max-w-md',
  closeOnBackdrop = true,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // 스크롤 잠금
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // 패널로 초기 포커스
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={[
          'relative z-10 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.25)] focus:outline-none',
          maxWidth,
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

/* ───── 확인 다이어로그 (delete / destructive / notice) ───── */

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-500 hover:bg-rose-600 text-white'
      : 'bg-[var(--accent)] hover:opacity-90 text-white'

  return (
    <Dialog open={open} onClose={onClose} ariaLabel={title} maxWidth="max-w-sm">
      <div className="flex flex-col gap-3 p-5">
        <h2 className="text-base font-bold tracking-[-0.02em]">{title}</h2>
        {description ? (
          <p className="text-sm text-[var(--muted)]">{description}</p>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              'rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60',
              confirmClass,
            ].join(' ')}
          >
            {loading ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
