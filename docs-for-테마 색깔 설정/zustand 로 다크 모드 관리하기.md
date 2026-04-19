# 핵심 코드

'''typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

type ThemeStore = {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () =>
        set({
          theme: get().theme === 'light' ? 'dark' : 'light',
        }),
    }),
    {
      name: 'stay-ops-theme',
    },
  ),
)
'''


# 핵심 구문 설명

code:
'''typescript
        set({
          theme: get().theme === 'light' ? 'dark' : 'light',
        }),
'''

설명:
set 은 셋한다는거 (상태값 설정)
get 은 상태값 가져 오기
persist 는 로컬스토리지랑 연동 키는 stay-ops-theme


# 이걸 가져다 쓰는곳:
/Users/terecal/stay-ops-container/stay-ops-front/src/shared/ui/theme-toggle.tsx

'''typescript
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
      <span>{theme === 'light' ? t('common:darkMode') : t('common:lightMode')}</span>
    </button>
  )
}
'''

# 값이 바뀌는것을 돔에 반영하는 곳
/Users/terecal/stay-ops-container/stay-ops-front/src/shared/layouts/app-shell.tsx

'''typescript
export function AppShell({ children }: PropsWithChildren) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
'''

# 위의 코드가 실행되는 효과
document.documentElement.dataset.theme = 'dark' 가 실행되면 런타임에 DOM이 이렇게 바뀜:
<html lang="en" data-theme="dark">   ← JS가 속성을 추가



# data-theme="dark" 에 따라 다크 모드가 설정되는 이유

정답은 **CSS 변수 스위칭**이다. 스타일 전환을 담당하는 파일은:

/Users/terecal/stay-ops-container/stay-ops-front/src/index.css

그중에서도 아래 코드가 동작하게 됨
'''css
:root[data-theme="dark"] {
  color-scheme: dark;
  --background: #161311;
  --foreground: #f7f1e8;
  --muted: #b8ab9c;
  --surface: rgba(31, 25, 22, 0.88);
  --surface-strong: #241d19;
  --border: rgba(240, 219, 194, 0.12);
  --accent: #f29e61;
  --accent-strong: #ffd2ae;
  --ring: rgba(242, 158, 97, 0.34);
  --control: rgba(41, 33, 29, 0.88);
  --control-hover: rgba(54, 43, 38, 0.96);
  --control-active: linear-gradient(135deg, #f29e61 0%, #c55f1f 100%);
}
'''

1) Card 컴포넌트 — 가장 단순하고 전형적인 패턴
src/shared/ui/card.tsx:11-26

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

border-[var(--border)] — 테두리
bg-[var(--surface)] — 배경
text-[var(--muted)] — 부가 텍스트 색
여기엔 theme === 'dark' 같은 조건문이 하나도 없습니다. 그런데도 다크 모드에서 자동으로 색이 바뀌죠. 이게 핵심.

2) AppShell 헤더 — 배경·테두리·그림자
src/shared/layouts/app-shell.tsx:22

<header className="sticky top-4 z-10 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur md:px-6">
