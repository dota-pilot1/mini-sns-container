# Step 4 — 프론트: API 클라이언트 + 라우팅

> 목표: UI를 만들기 전에 **API 호출 레이어와 타입, 라우트 뼈대**를 먼저 깔아둔다.
> 기존 `features/auth/*` 패턴을 그대로 미러링한다.

---

## 1. 생성할 파일 구조

```
stay-ops-front/src/features/room/
├── api/
│   └── room-api.ts             ← apiFetch() 래퍼 호출
├── model/
│   ├── room-schema.ts          ← zod 스키마 (요청/응답)
│   ├── room-types.ts           ← 도메인 enum (RoomStatus, RoomType, RoomOption)
│   └── use-rooms.ts            ← React Query 훅 (list, get, mutations)
```

> `features/auth/login`, `features/auth/signup` 에서 `api/`, `model/` 분리 패턴이 이미 있음 — 그대로 따라감.

---

## 2. 모델 레이어

### 2-1. `room-types.ts`

- `RoomStatus`, `RoomType`, `RoomOption` 을 **서버 enum 문자열과 1:1 매칭**되는 TS union/enum으로 정의.
- 상태별 한글 라벨/배지 색상 매핑도 여기 둠 (UI 공용).

```ts
export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  VACANT: '공실',
  RESERVED: '예약',
  OCCUPIED: '입실',
  CLEANING: '청소중',
  MAINTENANCE: '수리중',
};
```

### 2-2. `room-schema.ts` (zod)

- `createRoomSchema`, `updateRoomSchema`, `changeStatusSchema`, `roomResponseSchema`, `listRoomsParamsSchema`
- 서버 `@Valid` 규칙과 **동일한 검증**을 프론트에서도 (즉시 피드백용).
- 응답 스키마는 `roomResponseSchema` 하나 만들어서 리스트/단건 모두 재사용.

---

## 3. API 레이어

### 3-1. `room-api.ts`

`shared/api/client.ts` 의 `apiFetch()` 를 쓰면 **Bearer 토큰 자동 첨부 + 401 처리**가 무료로 붙음. 새로 만들지 말고 그대로 사용.

```ts
// 시그니처만 예시
export async function createRoom(cmd: CreateRoomInput): Promise<RoomResponse>
export async function listRooms(params: ListRoomsParams): Promise<RoomResponse[]>
export async function getRoom(id: string): Promise<RoomResponse>
export async function updateRoom(id: string, cmd: UpdateRoomInput): Promise<RoomResponse>
export async function changeRoomStatus(id: string, status: RoomStatus): Promise<RoomResponse>
export async function deleteRoom(id: string): Promise<void>
```

- 각 함수는 응답을 `roomResponseSchema.parse()` 로 런타임 검증.
- 에러는 서버 공통 포맷(`{code, message}`) 그대로 throw — 공통 에러 처리기가 받음.

### 3-2. `use-rooms.ts` (React Query 훅)

- `useRoomsQuery(params)` — 리스트 조회
- `useRoomQuery(id)` — 단건
- `useCreateRoomMutation()`, `useUpdateRoomMutation()`, `useChangeRoomStatusMutation()`, `useDeleteRoomMutation()`
- 성공 시 `queryClient.invalidateQueries(['rooms'])` 로 목록 갱신.

> React Query 가 프로젝트에 이미 있는지 확인 필요 — 없으면 `@tanstack/react-query` 추가 + `app/providers` 에 `QueryClientProvider` 붙이기.

---

## 4. 라우팅 (TanStack Router)

### 4-1. 추가할 라우트

| 경로                | 파일                                            | 가드         |
| ------------------- | ----------------------------------------------- | ------------ |
| `/rooms`            | `routes/room-list-page.tsx`                     | requireAuth  |
| `/rooms/new`        | `routes/room-create-page.tsx`                   | requireAuth  |
| `/rooms/:id`        | `routes/room-detail-page.tsx`                   | requireAuth  |
| `/rooms/:id/edit`   | `routes/room-edit-page.tsx`                     | requireAuth  |

- `app/router.tsx` 에 등록 — `login-page` 등록 방식 그대로 복사.
- **인증 가드만** 걸기 (로그인 여부). Role 가드는 이후 다른 파트에서.

### 4-2. 네비게이션 진입점

- 홈페이지(`home-page.tsx`) 또는 공통 헤더에 "방 관리" 링크 추가.
- 링크는 일단 모든 로그인 사용자에게 노출 — 권한별 노출 제어는 이후 구현.

---

## 5. 검증 체크리스트

- [ ] `room-api.ts` 각 함수가 서버 Swagger 응답 스키마와 일치
- [ ] zod 스키마 파싱 실패 시 콘솔에 의미 있는 에러
- [ ] 401 발생 시 auth-store 초기화 + 로그인 페이지로 (기존 `apiFetch` 동작 확인)
- [ ] 라우트 4개 모두 빈 페이지라도 렌더링됨 (다음 스텝에서 내용 채움)

---

## 다음 단계
→ [step5-프론트 방목록과 CRUD UI.md](./step5-프론트%20방목록과%20CRUD%20UI.md)
