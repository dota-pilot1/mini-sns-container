# Step 2 — 서버: 도메인 + 애플리케이션 계층

> 목표: `com.cj.stayops.backend.room` 패키지를 `user` 모듈 패턴 그대로 미러링해서 만든다.
> **이 단계에서는 Spring/JPA 의존성이 domain/에 새어들지 않게** 주의한다.

---

## 1. 생성할 패키지 구조

```
com.cj.stayops.backend.room/
├── domain/
│   ├── model/
│   │   ├── Room.java              ← Aggregate Root (Always-Valid)
│   │   ├── RoomId.java            ← UUID VO
│   │   ├── RoomNumber.java        ← 유일 호수 VO (길이/형식 검증)
│   │   ├── Money.java             ← 월세/보증금 공용 VO (long, KRW)
│   │   ├── RoomType.java          ← enum: SINGLE/DOUBLE/FAMILY
│   │   ├── RoomStatus.java        ← enum: VACANT/RESERVED/OCCUPIED/CLEANING/MAINTENANCE
│   │   └── RoomOption.java        ← enum: AIRCON/PRIVATE_BATH/WINDOW/...
│   ├── exception/
│   │   ├── RoomNumberDuplicatedException.java
│   │   ├── RoomNotFoundException.java
│   │   └── InvalidRoomFieldException.java
│   └── repository/
│       └── RoomRepository.java    ← 인터페이스만 (findById, findByRoomNumber, save, existsByRoomNumber, delete, findAll(filter))
└── application/
    ├── dto/
    │   ├── CreateRoomCommand.java
    │   ├── UpdateRoomCommand.java
    │   ├── ChangeRoomStatusCommand.java
    │   ├── ListRoomsQuery.java     ← 필터(층, 상태 등)
    │   └── RoomResult.java         ← 조회 응답 DTO
    └── usecase/
        ├── CreateRoomUseCase.java
        ├── UpdateRoomUseCase.java
        ├── ChangeRoomStatusUseCase.java
        ├── GetRoomUseCase.java
        ├── ListRoomsUseCase.java
        └── DeleteRoomUseCase.java
```

---

## 2. 핵심 결정사항

### 2-1. `Room` 애그리거트 설계 원칙

- **불변 필드 + 재생성 패턴**: 수정 시 `room.updatedWith(...)` 처럼 새 인스턴스 리턴 (user 모듈과 통일).
- **정적 팩토리**: `Room.create(cmd)` — 신규 생성 시 `id`, `createdAt` 채움.
  `Room.rehydrate(...)` — 인프라에서 DB → 도메인 복원 시 사용.
- **도메인 메서드**: `changeStatus(newStatus)`, `updateFields(...)`, `delete()` — 규칙 위반 시 예외 던짐.

### 2-2. `Money` VO

- `user` 모듈에 없는 새 공용 VO → `room/domain/model/Money.java`에 두되, **나중에 다른 도메인에서 쓰면 `common` 패키지로 승격** 고려.
- 필드: `long amount` (KRW 원 단위), 음수 불가.

### 2-3. `RoomRepository` 인터페이스

```java
Optional<Room> findById(RoomId id);
Optional<Room> findByRoomNumber(RoomNumber number);
boolean existsByRoomNumber(RoomNumber number);
Room save(Room room);                        // 생성/수정 공용
List<Room> findAll(ListRoomsQuery query);    // 필터링 포함
void delete(RoomId id);
```

---

## 3. 유스케이스 시그니처

| UseCase                    | 입력                       | 출력           | 비고                                      |
| -------------------------- | -------------------------- | -------------- | ----------------------------------------- |
| `CreateRoomUseCase`        | `CreateRoomCommand`        | `RoomResult`   | `existsByRoomNumber` 체크 → 중복 예외     |
| `UpdateRoomUseCase`        | `UpdateRoomCommand`        | `RoomResult`   | 호수 변경 시 중복 체크                    |
| `ChangeRoomStatusUseCase`  | `ChangeRoomStatusCommand`  | `RoomResult`   | 삭제된 방이면 예외                        |
| `GetRoomUseCase`           | `RoomId`                   | `RoomResult`   | 단건 조회                                 |
| `ListRoomsUseCase`         | `ListRoomsQuery`           | `List<RoomResult>` | 층/상태 필터                          |
| `DeleteRoomUseCase`        | `RoomId`                   | `void`         | soft delete (deletedAt 세팅)              |

> 모든 UseCase는 `@Service @Transactional`, 생성자 주입, **3~10줄짜리 오케스트레이션**만. 비즈니스 규칙은 도메인에.

---

## 4. 검증 (단위 테스트)

- [ ] `RoomTest` — 생성, 상태 변경, 잘못된 필드 예외
- [ ] `RoomNumberTest` — 길이/형식 제약
- [ ] `MoneyTest` — 음수 거부
- [ ] `CreateRoomUseCaseTest` — mock repository로 중복 케이스 검증

> JPA 없이 **순수 Java 단위 테스트**. 인프라는 Step 3에서.

---

## 다음 단계
→ [step3-서버 인프라+프레젠테이션.md](./step3-서버%20인프라+프레젠테이션.md)
