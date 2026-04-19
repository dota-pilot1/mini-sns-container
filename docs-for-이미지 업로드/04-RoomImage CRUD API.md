# 04. RoomImage CRUD API

## 목표
업로드 완료 후 DB 에 등록, 갤러리 조회, 삭제, 대표 지정.

## 엔드포인트

### 1) 등록 — `POST /api/rooms/{roomId}/images`
S3 업로드가 끝난 뒤 호출. 서버는 `HeadObject` 로 실존 확인 후 DB 저장.
```json
// request
{ "s3Key": "rooms/42/.../uuid-front.jpg" }

// response (201)
{
  "id": 17,
  "roomId": 42,
  "url": "https://...",
  "isPrimary": false,
  "sortOrder": 3,
  "createdAt": "2026-04-19T..."
}
```

동작
- `HeadObject` 로 s3Key 실존·contentType·size 검증
- 첫 이미지면 자동으로 `isPrimary=true`
- `sortOrder` 는 기존 max+1

### 2) 갤러리 조회 — `GET /api/rooms/{roomId}/images`
```json
[
  { "id": 17, "url": "...", "isPrimary": true, "sortOrder": 0 },
  ...
]
```
`sortOrder ASC` 정렬.

### 3) 삭제 — `DELETE /api/rooms/{roomId}/images/{imageId}`
- DB 삭제 + S3 `DeleteObject` 동시 수행 (트랜잭션 경계 밖에서 S3 호출)
- 삭제 대상이 대표였다면: 남은 이미지 중 `sortOrder` 가장 작은 것을 대표로 승격
- 204 응답

### 4) 대표 지정 — `PATCH /api/rooms/{roomId}/images/{imageId}/primary`
- 해당 방의 모든 이미지 `isPrimary=false` → 대상 하나만 `true`
- 단일 트랜잭션 안에서 UPDATE 2회
- 200 응답

### 5) 순서 변경 (선택, 08 이후) — `PATCH /api/rooms/{roomId}/images/reorder`
```json
{ "order": [17, 22, 19] }
```
배열 순서대로 `sortOrder` 재할당.

## 구현 포인트

### URL 변환
`s3Key → url` 은 응답 직전에 계산:
- 공개 버킷이면: `https://{bucket}.s3.{region}.amazonaws.com/{key}`
- private 유지하면: **매 응답마다 presigned GET URL** 발급 (TTL 5분 이상)

> 초기엔 private + presigned GET 을 권장. 공개해도 되는 시점에 단순화.

### 에러 매핑
- s3Key 가 S3 에 없음 → 409 `IMAGE_NOT_UPLOADED`
- room 없음 → 404 `ROOM_NOT_FOUND`
- 대표 지정 대상이 해당 방 소속이 아님 → 403 `IMAGE_NOT_OWNED`

## 완료 기준
- 업로드 → 등록 → 조회 → 대표 변경 → 삭제 플로우가 Postman 으로 왕복
- 마지막 이미지 삭제 시 대표도 같이 없어짐 (승격할 대상 없음)
- 방 삭제 시 이미지들도 S3/DB 에서 정리되는지 결정 (기본 cascade 안 함이면 별도 처리)
