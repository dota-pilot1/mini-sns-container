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
    <div className="flex min-h-svh w-full flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="flex h-12 items-center gap-4 px-4 md:px-6">
          {/* Left: compact title */}
          <Link
            to={user ? '/' : '/login'}
            className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]"
          >
            StayOps
          </Link>

          {/* Center: main nav (only when logged in) */}
          {user ? (
            <nav className="mx-auto inline-flex rounded-md border border-[var(--border)] bg-[var(--control)] p-0.5">
              <NavLink active={pathname === '/'} to="/">
                대시보드
              </NavLink>
              <NavLink
                active={pathname.startsWith('/rooms')}
                to="/rooms"
              >
                방관리
              </NavLink>
              <NavLink
                active={pathname.startsWith('/tenants')}
                to="/tenants"
              >
                입주자
              </NavLink>
              <NavLink
                active={pathname.startsWith('/users')}
                to="/users"
              >
                관리자
              </NavLink>
            </nav>
          ) : (
            <div className="ml-auto" />
          )}

          {/* Right: utilities */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--control)] px-1 py-0.5">
              <LanguageSelect />
              <ThemeToggle />
            </div>
            {user ? (
              <UserMenu name={user.name} email={user.email} onLogout={handleLogout} />
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white shadow-sm transition hover:opacity-90"
        aria-label={name}
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-30 min-w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
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
  to: '/' | '/rooms' | '/tenants' | '/users' | '/login' | '/signup'
}>

function NavLink({ active, children, to }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={[
        'inline-flex min-w-20 items-center justify-center rounded px-3 py-1 text-[13px] font-medium tracking-[-0.01em] transition',
        active
          ? 'bg-[var(--accent)] text-white shadow-sm'
          : 'text-[var(--muted)] hover:bg-[var(--control-hover)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}
