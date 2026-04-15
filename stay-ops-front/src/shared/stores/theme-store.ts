import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'sepia' | 'ocean' | 'forest'

export const THEMES: Theme[] = ['light', 'dark', 'sepia', 'ocean', 'forest']

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
      name: 'stay-ops-theme',
    },
  ),
)
