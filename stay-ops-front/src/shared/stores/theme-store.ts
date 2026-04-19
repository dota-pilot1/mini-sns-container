import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

/**
 * 관리자 UI 는 가시성 우선 — 라이트/다크 2종만 유지.
 * (이전: sepia/ocean/forest 제거, 너무 어두워 답답하다는 피드백)
 */
export const THEMES: Theme[] = ['light', 'dark']

type ThemeStore = {
  theme: Theme
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => {
        const index = THEMES.indexOf(get().theme)
        set({ theme: THEMES[(index + 1) % THEMES.length] })
      },
    }),
    {
      // v3: 라이트 톤 기본 + 테마 2종(light/dark) 으로 축소. 이전 키 무시 → 모두 light 로 시작.
      name: 'stay-ops-theme-v3',
      // 혹시 잘못된 값(sepia/ocean/forest)이 저장돼 있으면 light 로 보정
      merge: (persisted, current) => {
        const p = persisted as { theme?: string } | null | undefined
        const theme: Theme = p?.theme === 'dark' ? 'dark' : 'light'
        return { ...current, theme }
      },
    },
  ),
)
