/** 방에 등록된 이미지 1장 (서버 응답과 동일). */
export type RoomImage = {
  id: string
  roomId: string
  /** 조회용 presigned GET URL. TTL 이 있으므로 장기 캐시 금지. */
  url: string
  contentType: string
  sizeBytes: number
  sortOrder: number
  primary: boolean
  createdAt: string
}

export type PresignResponse = {
  key: string
  uploadUrl: string
  expiresInSeconds: number
}

/** 허용 MIME 타입 (서버와 동기화 필요). */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

/** 업로드 파일 상한 (서버 max-upload-bytes 와 동기화). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB
