import { type PropsWithChildren } from 'react'

import { cn } from '@/shared/lib/cn'

type CardProps = PropsWithChildren<{
  title: string
  description: string
  className?: string
}>

export function Card({ children, className, description, title }: CardProps) {
  return (
    <section
      className={cn(
        'grid gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur',
        className,
      )}
    >
      <div className="grid gap-1">
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </section>
  )
}
