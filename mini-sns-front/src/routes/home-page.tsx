import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur md:p-10">
        <span className="inline-flex w-fit rounded-full bg-[color:var(--ring)] px-3 py-1 text-sm font-medium text-[var(--accent-strong)]">
          {t('home.badge')}
        </span>
        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div className="grid gap-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] md:text-6xl">
              {t('home.title')}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              {t('home.description')}
            </p>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] bg-[var(--surface-strong)] p-5">
            <span className="text-sm font-medium text-[var(--muted)]">
              {t('home.stackLabel')}
            </span>
            <ul className="grid gap-2 text-sm">
              <li>Vite + React 19 + TypeScript</li>
              <li>TanStack Router + Query</li>
              <li>react-hook-form + zod</li>
              <li>Zustand + i18next + Tailwind</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {t('common.startNow')}
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-3 font-semibold"
          >
            {t('common.signIn')}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title={t('home.cards.router.title')}
          description={t('home.cards.router.description')}
        />
        <Card
          title={t('home.cards.form.title')}
          description={t('home.cards.form.description')}
        />
        <Card
          title={t('home.cards.theme.title')}
          description={t('home.cards.theme.description')}
        />
      </section>
    </div>
  )
}
