import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { THEMES, type Theme, useThemeStore } from '@/shared/stores/theme-store'

const THEME_SWATCHES: Record<Theme, string> = {
  light: '#fafafa',
  dark: '#1a1a1d',
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex min-w-24 items-center justify-between gap-2 rounded-full bg-transparent px-3 py-2 text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)] transition hover:bg-[var(--control-hover)]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span
          className="h-5 w-5 rounded-full border border-[var(--border)] shadow-[0_0_0_4px_var(--ring)] transition"
          style={{ background: THEME_SWATCHES[theme] }}
        />
        <span>{t(`common:theme.${theme}`)}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-20 mt-2 grid min-w-44 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur"
        >
          {THEMES.map((t_id) => {
            const active = t_id === theme
            return (
              <button
                key={t_id}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setTheme(t_id)
                  setOpen(false)
                }}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
                  active
                    ? 'bg-[var(--control-hover)] font-semibold text-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:bg-[var(--control-hover)] hover:text-[var(--foreground)]',
                ].join(' ')}
                type="button"
              >
                <span
                  className="h-4 w-4 rounded-full border border-[var(--border)]"
                  style={{ background: THEME_SWATCHES[t_id] }}
                />
                <span>{t(`common:theme.${t_id}`)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
