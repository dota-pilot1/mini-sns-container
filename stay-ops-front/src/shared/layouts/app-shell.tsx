import { Link, useRouterState } from '@tanstack/react-router'
import { type PropsWithChildren, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useThemeStore } from '@/shared/stores/theme-store'
import { LanguageSelect } from '@/shared/ui/language-select'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

export function AppShell({ children }: PropsWithChildren) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-4 md:px-6 md:py-6">
      <header className="sticky top-4 z-10 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <Link to="/" className="text-lg font-semibold tracking-[-0.04em]">
              Stay Ops
            </Link>
            <p className="text-sm text-[var(--muted)]">{t('common:tagline')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--control)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <NavLink active={pathname === '/'} to="/">
                {t('nav:home')}
              </NavLink>
              <NavLink active={pathname === '/login'} to="/login">
                {t('nav:login')}
              </NavLink>
              <NavLink active={pathname === '/signup'} to="/signup">
                {t('nav:signup')}
              </NavLink>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--control)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <LanguageSelect />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 md:py-10">{children}</main>
    </div>
  )
}

type NavLinkProps = PropsWithChildren<{
  active: boolean
  to: '/' | '/login' | '/signup'
}>

function NavLink({ active, children, to }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={[
        'inline-flex min-w-20 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-[-0.02em] transition duration-200',
        active
          ? 'bg-[image:var(--control-active)] text-[#fffaf0]! shadow-[0_10px_24px_rgba(0,0,0,0.18)] [text-shadow:0_1px_1px_rgba(0,0,0,0.28)]'
          : 'text-[var(--muted)] hover:bg-[var(--control-hover)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}
