# Step 3 — 서버: 인프라 + 프레젠테이션

> 목표: 도메인/애플리케이션을 **JPA와 REST API로 노출**한다. 이 단계가 끝나면 Swagger에서 수동으로 CRUD 다 돌려볼 수 있어야 한다.

---

## 1. 인프라 계층 (persistence)

### 1-1. 파일 구조

```
com.cj.stayops.backend.room.infrastructure/
└── persistence/
    ├── RoomJpaEntity.java            ← @Entity (테이블명 rooms)
    ├── RoomJpaRepository.java        ← extends JpaRepository<RoomJpaEntity, UUID>
    ├── RoomRepositoryImpl.java       ← implements RoomRepository (도메인 인터페이스)
    └── RoomMapper.java               ← Domain ↔ JPA 변환
```

### 1-2. `RoomJpaEntity` 필드

| 컬럼           | 타입                         | 제약                        |
| -------------- | ---------------------------- | --------------------------- |
| id             | UUID                         | PK                          |
| room_number    | VARCHAR(10)                  | unique, not null            |
| floor          | INT                          | not null                    |
| size_pyeong    | DECIMAL(4,1)                 | not null                    |
| room_type      | VARCHAR(20)                  | not null (enum as string)   |
| monthly_rent   | BIGINT                       | not null                    |
| deposit        | BIGINT                       | not null                    |
| status         | VARCHAR(20)                  | not null                    |
| options        | VARCHAR(255)                 | CSV 또는 @ElementCollection |
| memo           | VARCHAR(500)                 | nullable                    |
| created_at     | TIMESTAMP                    | not null                    |
| updated_at     | TIMESTAMP                    | not null                    |
| deleted_at     | TIMESTAMP                    | nullable (soft delete)      |

> **options 저장 방식**: MVP는 CSV(`"AIRCON,WINDOW"`) + 애플리케이션 변환이 가장 단순. 나중에 조건 검색 필요해지면 `@ElementCollection` 별도 테이블로 승격.

### 1-3. `RoomRepositoryImpl` 구현 포인트

- `findAll(ListRoomsQuery)` — JPA Specification 또는 간단한 JPQL로 필터링
- 조회 시 `deleted_at IS NULL` 조건 항상 포함 (soft delete)
- Mapper로 `Room` ↔ `RoomJpaEntity` 변환

---

## 2. 프레젠테이션 계층 (REST API)

### 2-1. 파일 구조

```
com.cj.stayops.backend.room.presentation/
├── dto/
│   ├── CreateRoomRequest.java       ← @Valid 필드 검증
│   ├── UpdateRoomRequest.java
│   ├── ChangeRoomStatusRequest.java
│   ├── ListRoomsParams.java         ← @RequestParam 묶음
│   └── RoomResponse.java
└── RoomController.java
```

### 2-2. 엔드포인트

| Method | Path                              | 설명               | UseCase                   |
| ------ | --------------------------------- | ------------------ | ------------------------- |
| POST   | `/api/rooms`                      | 방 등록            | CreateRoomUseCase         |
| GET    | `/api/rooms`                      | 방 목록 (필터)     | ListRoomsUseCase          |
| GET    | `/api/rooms/{id}`                 | 방 상세            | GetRoomUseCase            |
| PATCH  | `/api/rooms/{id}`                 | 방 정보 수정       | UpdateRoomUseCase         |
| PATCH  | `/api/rooms/{id}/status`          | 상태만 변경        | ChangeRoomStatusUseCase   |
| DELETE | `/api/rooms/{id}`                 | 방 삭제 (soft)     | DeleteRoomUseCase         |

### 2-3. 컨트롤러 스타일

- **3~5줄 원칙** — Request → Command 변환, UseCase 호출, Response 변환.
- `@Operation`, `@ApiResponses`, `@Tag(name="Room")` 로 Swagger 문서화.
- `@Valid` 로 입력 검증, 실패 시 `@ControllerAdvice`가 처리 (이미 있는 공통 예외 핸들러 활용).

### 2-4. 예외 매핑

기존 전역 예외 핸들러에 추가:

- `RoomNumberDuplicatedException` → 409 CONFLICT
- `RoomNotFoundException` → 404 NOT_FOUND
- `InvalidRoomFieldException` → 400 BAD_REQUEST

> `user` 모듈에서 이미 쓰는 패턴 그대로 따라하면 됨.

---

## 3. 수동 검증 체크리스트

Swagger UI (`/swagger-ui.html`)에서 다음을 돌려본다:

- [ ] POST `/api/rooms` 정상 등록
- [ ] POST `/api/rooms` 중복 호수 → 409
- [ ] POST `/api/rooms` 음수 월세 → 400
- [ ] GET `/api/rooms` 필터 없이 전체 조회
- [ ] GET `/api/rooms?floor=2&status=VACANT` 필터 조회
- [ ] PATCH `/api/rooms/{id}` 월세만 수정
- [ ] PATCH `/api/rooms/{id}/status` 상태 변경
- [ ] DELETE `/api/rooms/{id}` → 이후 목록에서 사라짐
- [ ] 삭제된 방 상태 변경 시도 → 404 또는 전용 예외

---

## 4. (선택) 통합 테스트

- [ ] `RoomControllerTest` — `@SpringBootTest` + `MockMvc` 로 각 엔드포인트 200/4xx 케이스
- [ ] 테스트용 H2 또는 Testcontainers PostgreSQL

> MVP에선 Swagger 수동 검증으로 시작해도 OK. 회귀 테스트가 필요해지는 시점에 추가.

---

## 다음 단계
→ [step4-프론트 API 클라이언트와 라우팅.md](./step4-프론트%20API%20클라이언트와%20라우팅.md)
