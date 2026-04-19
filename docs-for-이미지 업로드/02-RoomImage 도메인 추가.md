# 02. RoomImage 도메인 추가

## 목표
Room 한 개에 여러 이미지를 붙일 수 있는 도메인 모델 + JPA 스키마.

## 체크리스트

### 1) 엔티티 `RoomImage`
위치: `com.cj.stayops.backend.room.domain.RoomImage`

필드
- `id: Long` (PK, auto)
- `room: Room` (ManyToOne, FK `room_id`, LAZY)
- `s3Key: String` (unique)
- `contentType: String`
- `sizeBytes: long`
- `sortOrder: int` (기본 0, 갤러리 표시 순서)
- `isPrimary: boolean` (기본 false)
- `createdAt: Instant` (`@CreationTimestamp`)

제약
- `(room_id, is_primary)` 에 부분 unique 인덱스로 대표 이미지 1개 강제
  - Postgres: `CREATE UNIQUE INDEX ... WHERE is_primary = true`
  - JPA 로 표현 어려우면 서비스 레이어 트랜잭션으로 보정
- `s3Key` unique

### 2) Room 쪽 연관
- Room 에 `@OneToMany(mappedBy="room") List<RoomImage> images` 추가 여부 결정
- **권장**: 추가하지 않음. N+1 피하고 API 레벨에서 별도 조회
  (대표 이미지만 필요하면 전용 쿼리로 뽑음)

### 3) 리포지토리 `RoomImageRepository`
- `findAllByRoomIdOrderBySortOrderAsc(Long roomId)`
- `findFirstByRoomIdAndIsPrimaryTrue(Long roomId)`
- `findAllByRoomIdInAndIsPrimaryTrue(Collection<Long> roomIds)` — 목록용 일괄 조회
- `deleteByIdAndRoomId(Long id, Long roomId)`

### 4) 마이그레이션
- `spring.jpa.hibernate.ddl-auto=update` 라 초기 스키마는 자동 생성됨
- 부분 unique 인덱스는 별도 DDL 로 관리 (수동 실행 또는 `@Table(indexes=...)`)

## 완료 기준
- 서버 기동 시 `room_image` 테이블이 생성됨
- 같은 room 에 `isPrimary=true` 가 2개 들어가면 DB 제약으로 거부됨 (또는 서비스에서 방어)
- Room 삭제 시 이미지가 cascade 로 삭제되는지 결정 → **기본은 cascade 안 함** (S3 객체 남음 방지는 별도 처리)

## 다음 스텝 연결
- 03 에서 발급한 s3Key 를 이 엔티티에 저장
- 04 에서 CRUD API 를 이 리포지토리로 구현
