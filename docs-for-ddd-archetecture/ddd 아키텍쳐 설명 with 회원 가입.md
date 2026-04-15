# DDD 아키텍처 설명 (with 회원가입)

## 1. Auth 계층 구조

| 계층 | 역할 | 비유 |
|---|---|---|
| **Presentation** | 외부 요청/응답 처리, HTTP 입출력, 화면/API와 연결 | 접수 창구 |
| **Application** | 유스케이스 실행, 흐름 제어, 비즈니스 시나리오 조합 | 업무 담당자 |
| **Domain** | 핵심 규칙, 도메인 모델, 불변식, 비즈니스 의미 | 업무 규정집 + 실제 업무 대상 |
| **Infrastructure** | DB, JPA, 외부 시스템, 기술 구현체 | 창고 / 전산 시스템 |

## 2. 실제 패키지 구조

```
com.cj.stayops.backend.auth/
├── presentation/
│   ├── dto/
│   │   ├── SignupRequest.java      ← HTTP 요청 바디 (@Valid)
│   │   ├── SignupResponse.java     ← HTTP 응답 바디
│   │   └── ErrorResponse.java      ← 에러 응답
│   ├── AuthController.java         ← @RestController
│   └── AuthExceptionHandler.java   ← @RestControllerAdvice
│
├── application/
│   ├── dto/
│   │   ├── SignupCommand.java      ← UseCase 입력
│   │   └── SignupResult.java       ← UseCase 출력
│   └── SignupUseCase.java          ← @Service @Transactional
│
├── domain/
│   ├── model/
│   │   ├── UserId.java             ← Value Object
│   │   ├── Email.java              ← Value Object (검증 내장)
│   │   └── User.java               ← Aggregate Root
│   ├── exception/
│   │   ├── InvalidEmailException.java
│   │   ├── DuplicateEmailException.java
│   │   └── WeakPasswordException.java
│   └── repository/
│       └── UserRepository.java     ← 인터페이스만 (구현 X)
│
└── infrastructure/
    └── persistence/
        ├── UserJpaEntity.java      ← @Entity
        ├── UserJpaRepository.java  ← Spring Data JPA
        └── UserRepositoryImpl.java ← UserRepository 구현
```

## 3. 각 계층 상세

### 3.1 Presentation

**책임**
- HTTP 요청을 DTO로 역직렬화
- `@Valid`로 1차 형식 검증 (Bean Validation)
- Application 유스케이스 호출
- 결과/예외를 HTTP 응답으로 변환

**예시 코드**
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final SignupUseCase signupUseCase;

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
        SignupResult result = signupUseCase.execute(request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(SignupResponse.from(result));
    }
}
```

**Thin Controller 원칙**: 메서드 본문 3줄 이내. 비즈니스 규칙 없음.

---

### 3.2 Application

**책임**
- 유스케이스(비즈니스 시나리오) 실행
- Domain 객체 조합
- 트랜잭션 경계 설정 (`@Transactional`)
- 인프라 기술(해싱, Repository) 호출

**예시 코드**
```java
@Service
public class SignupUseCase {
    @Transactional
    public SignupResult execute(SignupCommand command) {
        Email email = Email.of(command.email());              // Domain 사용
        validatePasswordPolicy(command.rawPassword());         // 앱 정책
        if (userRepository.existsByEmail(email)) {             // Domain 인터페이스
            throw new DuplicateEmailException(email.value());  // Domain 예외
        }
        String hash = passwordEncoder.encode(command.rawPassword());
        User user = User.register(UserId.generate(), email, hash, command.name(), now());
        return SignupResult.from(userRepository.save(user));
    }
}
```

**핵심**: "무엇을 할지"가 아니라 **"어떤 순서로 할지"**를 정의. 규칙 자체는 Domain이 가짐.

---

### 3.3 Domain (시스템의 핵심)

**책임**
- 비즈니스 개념 정의 (`User`, `Email`, `UserId`)
- 불변식 강제 (Always-Valid: 잘못된 상태의 객체 생성 불가)
- 비즈니스 예외 정의
- Repository **인터페이스** 정의 (구현은 Infra)

**예시 코드 — Value Object**
```java
public final class Email {
    private final String value;

    private Email(String value) { this.value = value; }

    public static Email of(String raw) {
        if (raw == null || raw.isBlank()) throw new InvalidEmailException(...);
        String normalized = raw.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalized).matches())
            throw new InvalidEmailException(...);
        return new Email(normalized);
    }
}
```

**예시 코드 — Aggregate Root**
```java
public class User {
    // JPA 어노테이션 없음. Spring 몰라도 됨.
    private final UserId id;
    private final Email email;
    private final String passwordHash;

    public static User register(UserId id, Email email, String hash, String name, Instant now) {
        // 불변식 검증 후 객체 생성
    }
}
```

**도메인 순수성 규칙**: 이 계층의 파일에 다음이 있으면 **위반**:
- `import jakarta.persistence.*` (JPA)
- `import org.springframework.*` (Spring)
- `import jakarta.validation.*` (Bean Validation)
- `import org.hibernate.*`

→ 순수 자바 표준 + 같은 도메인 내부 import만 허용.

**왜?** DB/프레임워크가 바뀌어도 비즈니스 규칙은 유지되어야 하므로.

---

### 3.4 Infrastructure

**책임**
- Domain 인터페이스의 실제 기술 구현
- JPA 엔티티, DB 접근, 외부 API 연동
- 도메인 ↔ 기술 모델 매핑

**예시 코드 — JPA 엔티티 (도메인과 분리)**
```java
@Entity
@Table(name = "users")
public class UserJpaEntity {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(unique = true, length = 254)
    private String email;
    // ...
}
```

**예시 코드 — Repository 구현**
```java
@Repository
public class UserRepositoryImpl implements UserRepository {
    private final UserJpaRepository jpa;

    public User save(User user) {
        UserJpaEntity entity = toEntity(user);
        return toDomain(jpa.save(entity));
    }

    // 도메인 ↔ JPA 매핑
    private UserJpaEntity toEntity(User user) { ... }
    private User toDomain(UserJpaEntity entity) { ... }
}
```

**확장 예시** — Infra에 들어올 수 있는 다른 것들:
```
infrastructure/
├── persistence/    ← DB (현재)
├── security/       ← JWT 구현 (예정)
├── mail/           ← 이메일 발송
├── cache/          ← Redis
├── messaging/      ← Kafka
└── external/       ← 외부 API (결제, 알림)
```

## 4. 회원가입 한 요청의 실제 흐름

```
[브라우저] POST /api/auth/signup {"email": "a@b.com", "password": "pw12345", "name": "홍길동"}
    │
    ▼
① Presentation: AuthController.signup()
    - Spring이 JSON → SignupRequest 역직렬화
    - @Valid로 Bean Validation (email 형식, 길이)
    - request.toCommand()로 SignupCommand 변환
    │
    ▼
② Application: SignupUseCase.execute(command)
    - @Transactional 트랜잭션 시작
    │
    ├─► Domain: Email.of("a@b.com")
    │      → 정규식 검증 + 소문자 정규화
    │      → Email VO 반환
    │
    ├─► Application 내부: validatePasswordPolicy(...)
    │      → 길이/문자 조합 검증
    │
    ├─► Domain 인터페이스: userRepository.existsByEmail(email)
    │      │
    │      ▼
    │   Infrastructure: UserRepositoryImpl.existsByEmail()
    │      → UserJpaRepository.existsByEmail()
    │      → SQL: SELECT EXISTS(... WHERE email=?)
    │      ◄ false
    │
    ├─► 외부: passwordEncoder.encode("pw12345")
    │      → BCrypt 해시 반환
    │
    ├─► Domain: User.register(UserId.generate(), email, hash, name, now)
    │      → User Aggregate 생성 (메모리상 객체)
    │
    └─► Domain 인터페이스: userRepository.save(user)
           │
           ▼
        Infrastructure: UserRepositoryImpl.save()
           → User → UserJpaEntity 매핑
           → SQL: INSERT INTO users (...)
           → 저장된 Entity → User 매핑
           ◄ User 반환
    │
    - SignupResult.from(saved) 변환
    - @Transactional 커밋
    ◄ SignupResult 반환
    │
    ▼
③ Presentation: ResponseEntity 생성
    - SignupResponse.from(result)
    - HTTP 201 Created + JSON 바디
    │
    ▼
[브라우저] 201 Created {"userId": "...", "email": "a@b.com", ...}
```

**예외 발생 시 흐름** (예: 이메일 중복)
```
UseCase에서 DuplicateEmailException throw
    │
    ▼
Spring이 예외를 잡아 AuthExceptionHandler로 라우팅
    │
    ▼
@ExceptionHandler(DuplicateEmailException.class)
    → 409 Conflict + {"code": "DUPLICATE_EMAIL", ...}
```

## 5. Domain이 어디에 쓰이나 (실제 import 기반)

### 5.1 Application이 Domain을 사용
`SignupUseCase.java`:
- `domain.model.Email` → `Email.of()` 호출
- `domain.model.User` → `User.register()` 호출
- `domain.model.UserId` → `UserId.generate()` 호출
- `domain.repository.UserRepository` → 저장소 인터페이스
- `domain.exception.DuplicateEmailException`
- `domain.exception.WeakPasswordException`

`SignupResult.java`:
- `domain.model.User` → User를 DTO로 변환

### 5.2 Infrastructure가 Domain을 사용
`UserRepositoryImpl.java`:
- `domain.model.Email/User/UserId` → JPA Entity ↔ 도메인 매핑
- `domain.repository.UserRepository` → **구현 대상 인터페이스**

### 5.3 Presentation이 Domain을 사용
`AuthExceptionHandler.java`:
- `domain.exception.*` → 도메인 예외를 HTTP 응답으로 변환

**핵심**: Domain은 아무도 import하지 않고, 모두가 Domain을 import한다.

## 6. 의존성 방향

```
     ┌─────────────────┐
     │  Presentation   │
     └────────┬────────┘
              │ 의존
              ▼
     ┌─────────────────┐      ┌──────────────────┐
     │   Application   │      │  Infrastructure  │
     └────────┬────────┘      └────────┬─────────┘
              │ 의존                    │ 의존 (구현)
              ▼                         │
     ┌─────────────────┐◄───────────────┘
     │     Domain      │   ← 아무에게도 의존 X
     │  (가장 안쪽)    │
     └─────────────────┘
```

**축약 표기**
- `Presentation → Application → Domain`
- `Infrastructure → Domain` (인터페이스 구현)
- `Presentation → Domain` (예외 타입 참조)

**역방향은 절대 금지**
- ❌ `Domain → Application`
- ❌ `Domain → Infrastructure`
- ❌ `Domain → Presentation`

## 7. DTO가 계층마다 따로 있는 이유

같은 "회원가입 데이터"를 담는 DTO가 4개:

| DTO | 계층 | 용도 |
|---|---|---|
| `SignupRequest` | Presentation | HTTP 역직렬화 + Bean Validation |
| `SignupCommand` | Application | UseCase 입력 (HTTP 몰라도 됨) |
| `SignupResult` | Application | UseCase 출력 (User 도메인 숨김) |
| `SignupResponse` | Presentation | HTTP 직렬화 |

**왜 하나로 안 쓰나**
- Application이 HTTP/Bean Validation에 결합되지 않게
- **CLI, Kafka, 테스트 등 HTTP 없는 경로에서도 UseCase 재사용 가능**
- 계층 경계에서 변환 → 한쪽 변경이 다른 쪽에 파급 안 됨

## 8. 핵심 원칙 정리

1. **Domain이 가장 안쪽** — 다른 계층에 의존하지 않음
2. **의존성 방향 불변** — 바깥 → 안쪽만 허용
3. **Domain에 프레임워크 금지** — JPA/Spring/Validation 어노테이션 X
4. **Always-Valid VO** — 잘못된 Email 객체는 애초에 만들 수 없음
5. **Thin Controller / Rich Domain** — 로직은 Domain에, Controller는 얇게
6. **Repository는 Domain이 계약, Infra가 구현** — DIP (의존성 역전)
7. **계층 경계에서 DTO 변환** — 관심사 격리

## 9. 언제 DDD가 과할 수 있나 (현실적 균형)

DDD는 만능이 아님. 다음 경우엔 오버엔지니어링:

- **CRUD만 하는 단순 관리자 페이지** → 분리 이득 < 비용
- **MVP / 프로토타입** → 요구사항이 내일 뒤집힐 수 있음
- **소규모 팀(1~3명) 단기 프로젝트** → 규율보다 속도
- **도메인 규칙이 거의 없는 경우** → Service + JPA Entity로 충분

**이 프로젝트(stay-ops)에 DDD가 적합한 이유**
- 숙박 운영 = 예약 중복, 요금 정책, 체크인 상태 머신 등 **규칙 많음**
- 장기 프로젝트 → 유지보수 비용 회수 가능
- 팀 협업 시 "어디에 뭐가 있는지" 예측 가능성 중요

**현실 팁**: 한 프로젝트 안에서도 **농도 조절**
- 핵심 도메인(인증, 예약, 결제) → 엄격한 DDD
- 주변 기능(통계, 간단 설정) → Service + JPA 간단 구조

## 10. 읽기 쉬운 코드의 가치

**업계 통용 비율: 코드 읽기 : 쓰기 = 10 : 1**

DDD의 계층 분리가 비싼 이유는 "쓰는 시간"만 봤을 때. 하지만 팀 프로젝트에서는:

- 신규 투입 인원이 **구조를 빠르게 파악** → 온보딩 비용 절감
- 버그 수정 시 **영향 범위가 계층으로 격리** → 변경 안정성
- 요구사항 변경 시 **수정 위치가 예측 가능**

→ 장기적으로 DDD 투자비용 회수. 특히 **도메인 복잡도가 높고 프로젝트가 오래 가는 경우** 이득이 큼.
