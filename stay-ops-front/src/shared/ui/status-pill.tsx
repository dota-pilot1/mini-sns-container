import type { ReactNode } from 'react'

export type StatusTone =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'gray'

const TONE: Record<StatusTone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  slate: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  gray: 'bg-[var(--control)] text-[var(--muted)]',
}

type Props = {
  tone: StatusTone
  children: ReactNode
  title?: string
  /** 외부에서 추가 클래스 (예: shrink-0). */
  className?: string
}

/**
 * 작은 둥근 상태 배지. 결제 상태 / 방 상태 / 계약 상태 등 단발성 라벨에 공용.
 */
export function StatusPill({ tone, children, title, className }: Props) {
  return (
    <span
      title={title}
      className={[
        'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
        TONE[tone],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
