# Step 1 — 요구사항 정리 & 도메인 설계

> 목표: 코드 한 줄 안 짜고, **방(Room) 애그리거트의 모양과 규칙**을 결정한다. 이 단계의 산출물은 다이어그램/표이지 클래스가 아니다.

---

## 1. 기능 범위 (MVP)

- [ ] 방 등록 (관리자)
- [ ] 방 목록 조회 (층/상태 필터)
- [ ] 방 상세 조회
- [ ] 방 정보 수정 (월세, 옵션 등)
- [ ] 방 상태 변경 (공실 ↔ 예약 ↔ 입실 ↔ 청소중 ↔ 수리중)
- [ ] 방 삭제 (soft delete 여부 결정 필요)

> **MVP 제외**: 입실자 배정, 계약 관리, 월세 수납 — 별도 도메인으로 분리 예정

---

## 2. 필드 정의

| 필드          | 타입         | 제약                                | 비고                          |
| ------------- | ------------ | ----------------------------------- | ----------------------------- |
| id            | UUID         | PK                                  |                               |
| roomNumber    | String       | unique, 1~10자                      | 예: "201", "B-3"              |
| floor         | int          | -5 ~ 50                             | 지하층 음수 허용              |
| sizePyeong    | BigDecimal   | > 0, 소수 1자리                     | 평 단위                       |
| roomType      | enum         | SINGLE / DOUBLE / FAMILY            |                               |
| monthlyRent   | Money(long)  | >= 0, KRW                           | 원 단위                       |
| deposit       | Money(long)  | >= 0                                |                               |
| status        | enum         | VACANT / RESERVED / OCCUPIED / CLEANING / MAINTENANCE |                               |
| options       | Set\<enum>   | AIRCON / PRIVATE_BATH / WINDOW / REFRIGERATOR / DESK |                               |
| memo          | String?      | 0~500자                             | 관리자 메모                   |
| createdAt     | Instant      |                                     |                               |
| updatedAt     | Instant      |                                     |                               |

---

## 3. 도메인 규칙 (불변식)

1. **`roomNumber`는 한 고시원 내에서 유일**해야 한다.
2. `monthlyRent`, `deposit`은 음수일 수 없다.
3. `sizePyeong`은 0보다 커야 한다.
4. 상태 전이는 자유롭게 허용한다 (MVP). 단, 삭제된 방은 상태 변경 불가.

---

## 4. 상태 전이 다이어그램 (참고용)

```
        ┌─────────────┐
        │   VACANT    │◄────────────┐
        └──┬──────┬───┘             │
           │      │                 │
     ┌─────▼──┐ ┌─▼────────┐    ┌───┴─────┐
     │RESERVED│ │ CLEANING │    │MAINTENANCE│
     └─────┬──┘ └──────────┘    └─────────┘
           │         ▲                ▲
           ▼         │                │
        ┌─────────────┐               │
        │  OCCUPIED   │───────────────┘
        └─────────────┘
```

> MVP에서는 전이 제약 없이 모두 허용 → 실무에서 규칙이 생기면 Step 2 도메인 계층에 추가.

---

## 5. 결정해야 할 항목 ✅

- [ ] **소속(Building/고시원) 개념 필요?** — 단일 고시원이면 생략, 여러 고시원 관리면 `buildingId` 추가 필요
- [ ] **soft delete vs hard delete?** — soft 권장 (`deletedAt` Instant?)
- [ ] **층/호수 자동 계산?** — "201" → floor 2 자동 추론 여부. MVP는 수동 입력 추천
- [ ] **사진/이미지 업로드는 MVP 포함?** — 별도 스텝으로 빼는 걸 권장

---

## 다음 단계
→ [step2-서버 도메인+애플리케이션 계층.md](./step2-서버%20도메인+애플리케이션%20계층.md)
