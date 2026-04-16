import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '@/shared/auth/auth-store'
import { useThemeStore } from '@/shared/stores/theme-store'
import { LanguageSelect } from '@/shared/ui/language-select'
import { ThemeToggle } from '@/shared/ui/theme-toggle'

export function AppShell({ children }: PropsWithChildren) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clear)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const handleLogout = () => {
    clearAuth()
    navigate({ to: '/login' })
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-4 md:px-6 md:py-6">
      <header className="sticky top-4 z-10 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-1">
            <Link to={user ? '/' : '/login'} className="text-lg font-semibold tracking-[-0.04em]">
              Stay Ops
            </Link>
            <p className="text-sm text-[var(--muted)]">{t('common:tagline')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--control)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              {user ? (
                <>
                  <NavLink active={pathname === '/'} to="/">
                    {t('nav:home')}
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink active={pathname === '/login'} to="/login">
                    {t('nav:login')}
                  </NavLink>
                  <NavLink active={pathname === '/signup'} to="/signup">
                    {t('nav:signup')}
                  </NavLink>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--control)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <LanguageSelect />
              <ThemeToggle />
            </div>

            {user ? (
              <UserMenu name={user.name} email={user.email} onLogout={handleLogout} />
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 md:py-10">{children}</main>
    </div>
  )
}

/* ───── User Avatar + Dropdown ───── */

function UserMenu({
  name,
  email,
  onLogout,
}: {
  name: string
  email: string
  onLogout: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={ref}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white shadow-md transition hover:opacity-90"
        aria-label={name}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open ? (
        <div className="absolute right-0 top-12 z-20 min-w-56 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold">{name}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-500 transition hover:bg-[var(--surface-strong)]"
          >
            <LogoutIcon />
            {t('nav:logout')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

/* ───── NavLink ───── */

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
