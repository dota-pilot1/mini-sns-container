# 로그인 구현 계획 (v1)

## 목표
- 이메일 + 비밀번호로 로그인 → JWT Access Token 발급
- 프론트는 토큰을 보관하고 모든 API 요청에 `Authorization: Bearer <token>` 실어 보냄
- 백엔드는 필터에서 토큰을 검증하고 `SecurityContext` 에 인증 정보 세팅
- `/api/users/**` 는 인증 필요로 전환 (`/api/auth/**` 만 permitAll)

## 범위 (v1)
| 항목 | v1 |
|---|---|
| Access Token (JWT) | ✅ |
| Refresh Token | ❌ v2 |
| 토큰 블랙리스트 / 로그아웃 무효화 | ❌ v2 |
| 로그인 실패 Rate limit | ❌ v2 |
| Remember me | ❌ v2 |
| 권한/Role | ❌ v2 |

## 스택 결정
- **알고리즘**: HS256 (대칭키). 운영 분리 전 단일 서버면 HS로 충분.
- **만료**: Access 30분 (v2에서 refresh 붙이면 단축)
- **클레임**: `sub = userId (UUID)`, `email`, `iat`, `exp`
- **저장 위치 (프론트)**: Zustand + `localStorage` persist
  - 쿠키(HttpOnly) 는 XSS 에는 강하지만 CSRF/프론트-백 도메인 분리 복잡 → v1 에서는 localStorage 로 심플하게
  - 토큰 탈취 리스크는 v2 에서 refresh+짧은 access 로 완화

## 스텝
- [step1. 전략 결정 / 의존성 / 프로퍼티](./step1.md)
- [step2. JWT 인프라 (TokenProvider)](./step2.md)
- [step3. LoginUseCase + 도메인 계약 보강](./step3.md)
- [step4. `POST /api/auth/login` 엔드포인트](./step4.md)
- [step5. Spring Security JWT Filter](./step5.md)
- [step6. `/api/users/**` 보호 전환](./step6.md)
- [step7. 프론트 로그인 API + 토큰 저장](./step7.md)
- [step8. 프론트 보호 라우트 + 로그아웃 + 401 처리](./step8.md)

## 패키지 경계 (DDD)
- `auth/infrastructure/security/` — **auth 구현 수단**: `JwtProperties`, `JwtTokenProvider`, `JwtAuthentication`
- `auth/domain/exception/` — 토큰 도메인 예외: `InvalidTokenException`, `ExpiredTokenException`
- `config/security/` — **전역 보안 정책**: `SecurityConfig`, `JwtAuthenticationFilter`, `RestAuthenticationEntryPoint`

> 원칙: 토큰 "발급/검증" 은 auth 바운디드 컨텍스트의 인프라지만, 필터/엔트리포인트/URL 매칭은 전 엔드포인트에 걸리는 cross-cutting 관심사라 config 에 둔다. 의존 방향은 `config/security → auth` 단방향.

## 한 줄 요약
> "v1 은 access-only JWT. 프론트는 localStorage, 백엔드는 필터 한 개로 검증. refresh 는 v2."
