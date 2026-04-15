# Step 5. Spring Security JWT Filter

## 위치
`config/security/JwtAuthenticationFilter.java`

> **왜 `auth/` 밑이 아닌가?**
> 필터는 **전역 보안 미들웨어**다. 로그인/가입뿐 아니라 `/api/users/**`, 그 외 모든 보호 엔드포인트에 걸리는 cross-cutting 관심사이므로 특정 바운디드 컨텍스트(auth) 하위에 두지 않는다.
> 반면 step2 의 `JwtTokenProvider` 는 "토큰 발급/검증" 자체가 auth 의 구현 수단이라 `auth/infrastructure/security/` 에 위치.
> 의존 방향: `config/security/*` → `auth/infrastructure/security/JwtTokenProvider` (단방향, DDD 경계 유지).

## 역할
`OncePerRequestFilter` 상속.

```
Authorization 헤더에 "Bearer <token>" 있으면
  → JwtTokenProvider.verify(token)
  → Claims 에서 sub(UserId), email 추출
  → UsernamePasswordAuthenticationToken 생성
  → SecurityContextHolder 에 세팅
없거나 실패하면 그대로 체인 계속 (인증 없음 상태)
  → 보호 엔드포인트면 시큐리티가 401 반환
```

## 핵심 원칙
- 필터 내부에서 **예외를 응답으로 바꾸지 않음** — 검증 실패 시 SecurityContext 안 채우고 next 호출
  → 실제 401/403 응답은 Security 의 `AuthenticationEntryPoint` 가 담당
- 이미 SecurityContext 에 인증 있으면 skip (멱등)
- `/api/auth/**`, `/swagger-ui/**`, `/actuator/health` 는 필터에서 패싱해도 무방 (어차피 permitAll)

## 인증 엔트리 포인트
`config/security/RestAuthenticationEntryPoint.java`
- 미인증 요청이 보호 엔드포인트 접근 시 JSON 으로 401 반환
- 엔트리 포인트도 "전역 응답 정책" 이라 auth 가 아닌 `config/security/` 에 위치

```json
{ "code": "UNAUTHENTICATED", "message": "Authentication required" }
```

## 완료 기준
- 빈 등록: `JwtAuthenticationFilter`, `RestAuthenticationEntryPoint`
- 아직 SecurityConfig 에 주입은 안 함 (step6 에서 한 번에)
- 단위 테스트: 유효 토큰 → SecurityContext 세팅됨 / 만료 토큰 → 세팅 안 됨
