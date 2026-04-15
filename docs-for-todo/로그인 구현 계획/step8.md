# Step 8. 프론트 보호 라우트 + 로그아웃 + 401 처리

## 1. 보호 라우트 가드
TanStack Router 의 `beforeLoad` 훅 사용.

```ts
// src/app/router.tsx 또는 각 route definition
beforeLoad: ({ location }) => {
  const token = useAuthStore.getState().accessToken
  if (!token) {
    throw redirect({
      to: '/login',
      search: { redirect: location.href },
    })
  }
}
```
- 로그인/회원가입 라우트에는 달지 않음
- 홈, 추후 users 목록 등 보호 라우트에만

## 2. 401 전역 처리
`shared/api/client.ts` 의 `apiFetch` 에서:
```ts
if (response.status === 401) {
  useAuthStore.getState().clear()
  // 라우터에서 바로 redirect 는 싫으므로 ApiError 는 계속 throw
  // 라우트 가드가 다음 내비게이션에서 /login 으로 보냄
}
```
- 페이지 전환 없이 현재 뷰에서 401 뜨면 → 상단 토스트/알림 or 단순 페이지 리로드

## 3. 로그아웃
`src/features/auth/logout/` 또는 `shared/ui/user-menu.tsx`:
```ts
const clear = useAuthStore((s) => s.clear)
const navigate = useNavigate()

function onLogout() {
  clear()                    // 토큰 제거 (localStorage 포함)
  navigate({ to: '/login' })
}
```
- v1 은 서버 호출 없이 프론트에서만 토큰 폐기 (서버측 블랙리스트는 v2)

## 4. AppShell 조건부 렌더링
- 로그인 상태면: 내비게이션에 "로그아웃", 유저 이름 표시
- 비로그인이면: "로그인 / 회원가입" 버튼

## 체크리스트
- [ ] 비로그인으로 `/` 접근 → `/login?redirect=/` 로 이동
- [ ] 로그인 성공 → `redirect` 쿼리 있으면 그쪽으로, 없으면 `/`
- [ ] 토큰 만료 상태에서 API 호출 → 401 → 스토어 clear → 다음 클릭 시 로그인으로
- [ ] 로그아웃 버튼 → localStorage 에서 `stay-ops-auth` 제거 확인
- [ ] 새로고침 후 로그인 상태 유지 (persist)

## 완료 기준 (전체 로그인 feature v1 완료)
- 가입 → 로그인 → 보호 API 조회 → 로그아웃 의 풀 사이클 브라우저에서 동작
- 백엔드/프론트 빌드 둘 다 green
