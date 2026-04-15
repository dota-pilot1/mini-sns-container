# Step 1. 전략 결정 / 의존성 / 프로퍼티

## 목표
JWT 도입 전 사전 세팅. 코드를 쓰기 전에 결정/설치해야 하는 것만 모음.

## 결정 사항
- **토큰**: Access Token only (v1)
- **알고리즘**: HS256
- **만료**: 30분 (`1800` 초)
- **시크릿**: 환경변수 `JWT_SECRET` (>= 32바이트)
- **클레임**:
  ```
  sub   = UserId (UUID string)
  email = user.email
  iat   = 발급 시각
  exp   = 만료 시각
  ```
- **헤더**: `Authorization: Bearer <token>`

## 의존성 추가 (build.gradle)
```groovy
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly    'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly    'io.jsonwebtoken:jjwt-jackson:0.12.6'
```

## 프로퍼티 (application.yaml)
```yaml
app:
  jwt:
    secret: ${JWT_SECRET:dev-only-change-me-please-this-is-a-long-enough-hs256-secret-do-not-use-in-prod-0123456789}
    access-token-ttl-seconds: 1800
    issuer: stay-ops
```

## 체크리스트
- [ ] jjwt 의존성 추가 후 `./gradlew build` 통과
- [ ] `application.yaml` 에 `app.jwt.*` 블록 추가
- [ ] `.env` 에 `JWT_SECRET` 실 값 주입 (yaml 의 기본값은 dev 부팅용, 실서버는 반드시 override)
  - 레포 루트 `.gitignore` 가 이미 `.env` 를 제외함 → 그대로 파일로 두면 됨
  - `.env.example` 에는 `JWT_SECRET=` 빈 값 한 줄 남겨서 팀원이 세팅 필요한 걸 알 수 있게
- [ ] `JwtProperties` (@ConfigurationProperties) 클래스 생성 준비만 (구현은 step2)

## 완료 기준
애플리케이션이 기존과 동일하게 부팅되며 `app.jwt.*` 프로퍼티를 바인딩 가능한 상태.
