import { useTranslation } from 'react-i18next'

import { useThemeStore } from '@/shared/stores/theme-store'

export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <button
      className="inline-flex min-w-24 items-center justify-between gap-2 rounded-full bg-transparent px-3 py-2 text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)] transition hover:bg-[var(--control-hover)]"
      onClick={toggleTheme}
      type="button"
    >
      <span
        className={[
          'h-5 w-5 rounded-full border transition',
          theme === 'light'
            ? 'border-zinc-900 bg-zinc-900 shadow-[0_0_0_4px_rgba(23,23,23,0.08)]'
            : 'border-orange-200 bg-[var(--accent)] shadow-[0_0_0_4px_rgba(242,158,97,0.18)]',
        ].join(' ')}
      />
      <span>{theme === 'light' ? t('common.darkMode') : t('common.lightMode')}</span>
    </button>
  )
}
