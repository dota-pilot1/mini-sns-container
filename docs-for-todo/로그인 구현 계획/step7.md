# Step 7. 프론트 로그인 API + 토큰 저장

## FSD 구조
```
src/features/auth/login/
  api/login-api.ts        # POST /api/auth/login
  model/use-login.ts      # React Query mutation
  index.ts

src/shared/auth/
  auth-store.ts           # Zustand + persist(localStorage)
  types.ts                # AuthUser, AuthTokens
```

## auth-store.ts
```ts
interface AuthState {
  accessToken: string | null
  user: { userId: string; email: string; name: string } | null
  setAuth: (token: string, user: AuthUser) => void
  clear: () => void
}
```
- `persist` 로 `localStorage` 에 `stay-ops-auth` 키로 저장
- 새로고침 후에도 토큰 유지

## shared/api/client.ts 수정
요청 시 `Authorization` 자동 첨부:
```ts
const token = useAuthStore.getState().accessToken
if (token) headers.Authorization = `Bearer ${token}`
```
- `useAuthStore.getState()` 를 쓰는 이유: 훅 밖(함수)에서도 꺼낼 수 있어서
- 401 응답이면 → `useAuthStore.getState().clear()` + 로그인으로 유도 (step8)

## login-page.tsx 수정
기존 `window.alert(JSON.stringify(...))` 제거하고:
```ts
const { mutateAsync } = useLogin()
await mutateAsync({ email, password })
navigate({ to: '/' })
```
- 실패 시 `ApiError.code === 'INVALID_CREDENTIALS'` → 공통 에러 메시지 표시

## 완료 기준
- 로그인 성공 → 홈으로 이동 + 네트워크탭 이후 요청에 `Authorization` 헤더 붙음
- 새로고침 후에도 토큰 유지
- 틀린 비밀번호 → 폼 하단에 에러 메시지
