# 03. Presigned URL 업로드 API

## 목표
프론트가 S3 에 직접 PUT 할 수 있는 1회용 URL 을 서버가 발급.

## 엔드포인트
`POST /api/uploads/presign`

### Request
```json
{
  "scope": "room",         // 확장 대비
  "refId": 42,             // roomId
  "filename": "front.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 1048576
}
```

### Response
```json
{
  "key": "rooms/42/2026/04/19/uuid-front.jpg",
  "uploadUrl": "https://hibot-docu.s3.ap-northeast-2.amazonaws.com/...&X-Amz-Signature=...",
  "expiresInSeconds": 600
}
```

## 구현 포인트

### 1) Key 생성 규칙
`{scope}s/{refId}/{yyyy/MM/dd}/{uuid}-{safeFilename}`
- UUID 로 충돌 방지
- safeFilename: 한글·공백·특수문자 제거 후 확장자 유지

### 2) 검증
- `contentType` 화이트리스트: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- `sizeBytes` 상한: 예) 10MB
- `refId` 실존 여부 확인 (Room 존재 검증)
- 권한: 로그인 유저만 (JwtAuthFilter 통과)

### 3) 서비스 `S3PresignService`
```java
PresignedUrl issueUploadUrl(PresignRequest req) {
  validate(req);
  String key = buildKey(req);
  var putReq = PutObjectRequest.builder()
      .bucket(props.getS3().getBucket())
      .key(key)
      .contentType(req.contentType())
      .contentLength(req.sizeBytes())
      .build();
  var presigned = presigner.presignPutObject(b -> b
      .signatureDuration(Duration.ofSeconds(ttl))
      .putObjectRequest(putReq));
  return new PresignedUrl(key, presigned.url().toString(), ttl);
}
```

### 4) CORS (S3 버킷 쪽)
S3 콘솔에서 버킷 CORS 설정 필요:
```json
[{
  "AllowedOrigins": ["http://localhost:5173", "https://프론트도메인"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3000
}]
```
> 이 단계에서 한 번 설정하면 끝. 누락되면 브라우저 PUT 이 CORS 에러로 실패.

## 완료 기준
- Postman/curl 로 presign 요청 → 받은 URL 에 `curl -X PUT --data-binary @file` 성공
- 잘못된 contentType/size 는 400
- TTL 지난 URL 은 403 (S3 쪽에서)

## 리스크
- presign 한 후 실제 업로드가 실패하면 DB 에는 레코드가 없음 (S3 에도 객체 없음) — 정합성 OK
- 반대로 S3 업로드는 성공했는데 04 의 "register" API 호출을 안 하면 **고아 객체** 발생
  → 주기적으로 S3 키와 DB 를 비교하는 클린업 배치는 향후 과제
