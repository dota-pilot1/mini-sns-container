# Application(UseCase) vs 전통 MVC Service

## 핵심 한 줄

> **"Service인데, 도메인 규칙은 도메인에 빼고, 시나리오 단위로 쪼개고, HTTP/JPA와 분리된 순수한 조율자."**

겉보기엔 둘 다 `@Service @Transactional`이지만, **"무엇을 담느냐"의 철학**이 다르다.

---

## 5가지 차이

### ① 비즈니스 규칙의 위치
- **Service**: 규칙이 Service 안에 (이메일 정규식, 비번 길이 등)
- **UseCase**: 규칙은 Domain(VO/Aggregate)에, UseCase는 **호출만**
- → `Email.of()`, `User.register()`가 규칙 소유

### ② 클래스 분할 단위
- **Service**: 엔티티별 1개 (`UserService`에 signup/login/changePw 다 몰아)
- **UseCase**: **시나리오별 1개** (`SignupUseCase`, `LoginUseCase`, ...)
- → FSD의 `features/signup`, `features/login` 구조와 동일 철학

### ③ 입출력 DTO
- **Service**: `SignupRequest`(HTTP DTO) 직접 받는 경우 많음
- **UseCase**: `SignupCommand`/`SignupResult` 사용 (HTTP 무관)
- → CLI, Kafka, 배치, 테스트에서 **그대로 재사용 가능**

### ④ Repository 의존 방향
- **Service**: Spring Data `JpaRepository` 직접 주입 (JPA와 결합)
- **UseCase**: **Domain이 정의한** `UserRepository` 인터페이스 주입
- → 구현체(JPA/MongoDB/InMemory) 교체 가능 = **의존성 역전(DIP)**

### ⑤ 도메인 모델 vs 엔티티
- **Service**: `User` = JPA `@Entity` (getter/setter 덩어리, Anemic Model)
- **UseCase**: `User`(순수 도메인) ↔ `UserJpaEntity`(DB) **분리**
- → 도메인이 JPA/Spring 없이 단독 테스트 가능

---

## 요약 표

| 기준 | MVC Service | DDD UseCase |
|---|---|---|
| 규칙 위치 | Service 내부 | Domain 객체 |
| 분할 단위 | 엔티티별 | 시나리오별 |
| 입출력 | HTTP DTO | Command/Result |
| Repository | JPA 구현체 | Domain 인터페이스 |
| 엔티티 | JPA = Domain | JPA ≠ Domain (분리) |

---

## 코드로 보는 차이

### 전통 MVC Service — **Fat Service**

```java
@Service
public class UserService {
    public User signup(String email, String pw, String name) {
        // 규칙이 여기 다 있음
        if (!email.matches(EMAIL_REGEX)) throw ...;
        if (pw.length() < 8) throw ...;
        if (userRepository.existsByEmail(email)) throw ...;

        User user = new User();              // 빈 깡통
        user.setEmail(email.toLowerCase());   // 정규화도 여기
        user.setPassword(encoder.encode(pw));
        user.setName(name);
        return userRepository.save(user);
    }

    public User login(...)       { /* 이메일 규칙 또 검증 */ }
    public void changeEmail(...) { /* 이메일 규칙 또 검증 */ }
    public void changePw(...)    { /* ... */ }
    // 점점 1000줄짜리 God Service로
}
```

**문제점**
- 같은 이메일 규칙이 3~4곳에 **복붙**
- `User`가 setter 덩어리 (**Anemic Model**)
- HTTP DTO와 JPA Entity에 Service가 직접 의존

### DDD UseCase — **Thin Orchestrator**

```java
@Service
public class SignupUseCase {

    @Transactional
    public SignupResult execute(SignupCommand cmd) {
        Email email = Email.of(cmd.email());          // 규칙 = Email VO가 책임
        validatePasswordPolicy(cmd.rawPassword());
        if (userRepository.existsByEmail(email))
            throw new DuplicateEmailException(...);

        User user = User.register(                     // 규칙 = User가 책임
            UserId.generate(), email,
            passwordEncoder.encode(cmd.rawPassword()),
            cmd.name(), Instant.now(clock)
        );
        return SignupResult.from(userRepository.save(user));
    }
}
```

**특징**
- UseCase는 **"순서"만** 안다
- 규칙은 `Email`, `User`가 소유 → 로그인/비번변경에서 재사용
- `SignupCommand` 입력이라 HTTP 몰라도 호출 가능

---

## FSD와의 연결점

프론트엔드 FSD의 `features/` 단위 분리와 철학이 같다:

| FSD (Frontend) | DDD (Backend) |
|---|---|
| `features/signup/` | `auth/application/SignupUseCase` |
| `features/login/` | `auth/application/LoginUseCase` |
| `features/change-password/` | `auth/application/ChangePasswordUseCase` |
| `entities/user/` | `auth/domain/model/User` |
| `shared/api/` | `auth/infrastructure/` |

**"기능(시나리오) 단위로 파일을 쪼갠다"** 는 원칙이 양쪽에 공통.

---

## 한 줄 요약

> **MVC Service** = 엔티티별 만능 중재자 (규칙까지 다 소유)
> **DDD UseCase** = 시나리오별 얇은 지휘자 (규칙은 Domain, 순서만 담당)
>
> 이름보다 **"규칙의 위치"** 가 본질. MVC에서도 규칙을 도메인에 잘 분리하면 DDD에 수렴한다.
