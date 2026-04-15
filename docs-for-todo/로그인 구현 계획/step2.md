# Step 2. JWT 인프라 (TokenProvider)

## 위치
`auth/infrastructure/security/` (인증 = auth 의 인프라 관심사)

## 신규 파일
```
auth/infrastructure/security/JwtProperties.java          # @ConfigurationProperties("app.jwt")
auth/infrastructure/security/JwtTokenProvider.java       # 발급/검증
auth/infrastructure/security/JwtAuthentication.java      # (선택) 인증 principal 래퍼
```

## JwtTokenProvider 책임
- `String issue(UserId userId, Email email, Instant now)` → JWT 문자열
- `Claims verify(String token)` → 서명/만료 검증 후 Claims 반환, 실패 시 예외
- 내부에서 `Clock` 주입받아 테스트 친화적으로 (기존 `ApplicationConfig.clock()` 재사용)

## 예외
`auth/domain/exception/` 하위에:
- `InvalidTokenException` (서명 불일치/손상)
- `ExpiredTokenException` (만료)

> 왜 도메인에 두나? → "토큰" 자체가 auth 도메인 개념이기 때문. JJWT 의존은 infrastructure 에만.

## 유닛 테스트 시나리오
- 발급 후 검증 → sub/email 정상 복원
- 만료 시간 지난 토큰 → `ExpiredTokenException`
- 시크릿 다른 키로 검증 → `InvalidTokenException`

## 완료 기준
- `JwtTokenProvider` 단위 테스트 3개 통과
- 전역 빈 1개 등록 (`@Component`)
- 아직 아무 UseCase/Controller 에도 연결 안 됨 (다음 스텝에서)
