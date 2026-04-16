# 프론트 로그인: auth-store 생성 → 훅에서 활용


## Step1: 인증 스토어 만들기 (Zustand + localStorage persist)
===================================================================
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from './types'

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  clear: () => void
}

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
```
===================================================================
→ `accessToken` + `user` 를 하나의 스토어에서 관리.
→ `setAuth` : 로그인 성공 시 토큰 + 유저 정보를 한 번에 저장.
→ `clear` : 로그아웃 or 401 시 토큰 + 유저를 한 번에 제거.
→ `persist` 미들웨어가 localStorage 에 `stay-ops-auth` 키로 자동 동기화.
→ 새로고침해도 토큰 유지됨.


## Step2: setAuth 를 어떻게 활용하는가? (useLogin 훅)
===================================================================
```ts
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (body) => loginApi.execute(body),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
    },
  })
}
```
===================================================================
→ `useAuthStore((s) => s.setAuth)` 로 스토어에서 setAuth 함수만 꺼냄.
→ `useMutation` = React Query 의 "서버에 뭔가 보내는 훅".
→ `mutationFn` : 실제 API 호출 (`POST /api/auth/login`).
→ `onSuccess` : 서버 응답이 성공이면 자동 실행.
→ `data.accessToken` + `data.user` 를 setAuth 로 스토어에 저장.

풀어 쓰면 이런 흐름:
```
로그인 폼 제출
  → loginApi.execute({ email, password })    ← 서버에 POST
  → 서버가 { accessToken, user } 응답
  → onSuccess 발동
  → setAuth(token, user)                     ← 스토어에 저장
  → localStorage 에도 자동 반영 (persist)
  → 이후 모든 apiFetch 에 Authorization 헤더 자동 첨부
```


## Step3: clear 는 언제 쓰이나?
===================================================================
```ts
// 로그아웃 버튼
const handleLogout = () => {
  clearAuth()                   // accessToken=null, user=null
  navigate({ to: '/login' })
}

// apiFetch 에서 401 응답 시
if (response.status === 401) {
  useAuthStore.getState().clear()
}
```
===================================================================
→ 로그아웃: 사용자가 직접 누름 → clear → /login 이동.
→ 401 자동 처리: 토큰 만료/무효 → clear → 다음 라우트 전환 시 가드가 /login 으로.
→ clear 가 실행되면 localStorage 의 `stay-ops-auth` 도 같이 삭제됨 (persist 미들웨어).


## 한 줄 요약
===================================================================
"스토어에 setAuth / clear 두 함수만 두고,
 로그인 성공 시 setAuth 로 채우고, 로그아웃이나 401 시 clear 로 비운다.
 persist 가 localStorage 동기화까지 알아서 해줌."
===================================================================
