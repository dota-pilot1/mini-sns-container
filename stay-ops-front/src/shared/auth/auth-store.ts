import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthUser } from './types'

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clear: () => void
}

/**
 * 인증 상태 스토어 (Zustand + localStorage persist).
 *
 * - setAuth: 로그인 성공 시 토큰 + 유저 정보 저장
 * - clear: 로그아웃 or 401 시 토큰 + 유저 제거
 * - localStorage 키: `stay-ops-auth`
 * - 새로고침 후에도 토큰 유지
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (token, user) => set({ accessToken: token, user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'stay-ops-auth',
    },
  ),
)
