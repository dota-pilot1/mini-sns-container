# 05. 프론트 API 클라이언트 + React Query 훅

## 목표
업로드 2단계(presign → S3 PUT → register)를 하나의 훅으로 감싸고, 갤러리 조회/삭제/대표 훅 제공.

## 파일 구조
```
stay-ops-front/src/features/room/
├── api/
│   ├── room-api.ts           (기존)
│   └── room-image-api.ts     (신규)
├── model/
│   └── room-image-types.ts   (신규)
└── ui/
    └── room-image-gallery.tsx (07 에서)
```

## 타입 (`room-image-types.ts`)
```ts
export interface RoomImage {
  id: number;
  roomId: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PresignResponse {
  key: string;
  uploadUrl: string;
  expiresInSeconds: number;
}
```

## API 클라이언트 (`room-image-api.ts`)
- `requestPresign({ roomId, file }): Promise<PresignResponse>`
- `uploadToS3(uploadUrl, file): Promise<void>`
  - `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })`
  - **중요**: axios 인터셉터가 붙지 않도록 raw `fetch` 사용 (인증 헤더·baseURL 간섭 방지)
- `registerImage({ roomId, s3Key }): Promise<RoomImage>`
- `listImages(roomId): Promise<RoomImage[]>`
- `deleteImage({ roomId, imageId }): Promise<void>`
- `setPrimary({ roomId, imageId }): Promise<RoomImage>`

## 훅 (React Query)

### `useRoomImages(roomId)`
```ts
useQuery({
  queryKey: ['rooms', roomId, 'images'],
  queryFn: () => listImages(roomId),
  enabled: !!roomId,
})
```

### `useUploadRoomImage()`
한 파일에 대해 **presign → S3 PUT → register** 를 순서대로 실행.
```ts
useMutation({
  mutationFn: async ({ roomId, file }) => {
    const { key, uploadUrl } = await requestPresign({ roomId, file });
    await uploadToS3(uploadUrl, file);
    return registerImage({ roomId, s3Key: key });
  },
  onSuccess: (_, { roomId }) => {
    qc.invalidateQueries({ queryKey: ['rooms', roomId, 'images'] });
    qc.invalidateQueries({ queryKey: ['rooms'] }); // 목록 썸네일 갱신
  },
})
```

### `useDeleteRoomImage()`, `useSetPrimaryRoomImage()`
- 동일한 invalidation 패턴

## 동시 업로드
07 에서 다중 드롭 지원 시, `Promise.allSettled` 로 병렬 호출.
개별 실패는 토스트로 표시하되 다른 파일 진행은 막지 않음.

## 진행률 (선택)
`fetch` 는 업로드 진행률을 못 읽음. 진행률 바 필요 시 `XMLHttpRequest` 로 교체.
초기엔 스피너 + "N/M 업로드 중" 문구로 단순화.

## 완료 기준
- 훅만 써서 다른 페이지에서도 업로드·갤러리 재사용 가능
- 네트워크 탭에서 presign → S3 PUT(cross-origin) → register 3단계 확인됨
- 업로드 후 `rooms/:roomId/images` 쿼리가 자동 invalidate 되어 갤러리가 새로고침 없이 갱신
