# Step 3. LoginUseCase + 도메인 계약 보강

## 위치
- UseCase: `auth/application/LoginUseCase.java`
- DTO: `auth/application/dto/{LoginCommand, LoginResult}.java`
- 예외: `auth/domain/exception/InvalidCredentialsException.java`

## 흐름
```
LoginCommand(email, rawPassword)
  → Email.of(email)                        // InvalidEmailException 가능
  → userRepository.findByEmail(email)      // 존재 안 함도 일반화해서 InvalidCredentials 로
  → passwordEncoder.matches(raw, hash)     // 실패 시 InvalidCredentials
  → jwtTokenProvider.issue(userId, email, now)
  → LoginResult(accessToken, tokenType="Bearer", expiresIn, userId, email, name)
```

## 보안 원칙
- **"존재하지 않는 이메일" 과 "비밀번호 불일치" 를 동일 에러로 처리** → 계정 존재 여부 유출 방지
  - 응답 코드 `INVALID_CREDENTIALS`, HTTP 401
- 비밀번호 비교는 무조건 `PasswordEncoder.matches` (timing-safe)
- `passwordHash` 는 어디에도 로그로 남기지 않는다

## 의존성
```
LoginUseCase(
  UserRepository,
  PasswordEncoder,
  JwtTokenProvider,
  JwtProperties,   // expiresIn 계산용
  Clock
)
```

## 예외 매핑 (step4 에서 사용)
- `InvalidCredentialsException` → 401 `INVALID_CREDENTIALS`
- `InvalidEmailException` 은 이미 handler 에 있음 → 그대로 400

## 완료 기준
- LoginUseCase 단위 테스트: 성공 / 비번 틀림 / 없는 이메일 3 케이스
- 아직 HTTP 엔드포인트 없음 (step4)
