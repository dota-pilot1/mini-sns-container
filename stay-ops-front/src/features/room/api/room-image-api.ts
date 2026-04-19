import { apiFetch } from '@/shared/api/client'

import type {
  PresignResponse,
  RoomImage,
} from '@/features/room/model/room-image-types'

export type PresignRequestBody = {
  scope: 'room'
  refId: string
  filename: string
  contentType: string
  sizeBytes: number
}

export const roomImageApi = {
  /** 1단계: presigned PUT URL 발급. */
  presign(body: PresignRequestBody): Promise<PresignResponse> {
    return apiFetch<PresignResponse>('/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  /**
   * 2단계: S3 로 직접 업로드.
   * apiFetch 를 쓰지 않는 이유: baseURL·Authorization·Content-Type 기본값이 S3 서명에 간섭하기 때문.
   */
  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`S3 업로드 실패 (${response.status}): ${text || response.statusText}`)
    }
  },

  /** 3단계: 업로드된 key 를 서버에 등록. */
  register(roomId: string, s3Key: string): Promise<RoomImage> {
    return apiFetch<RoomImage>(`/api/rooms/${roomId}/images`, {
      method: 'POST',
      body: JSON.stringify({ s3Key }),
    })
  },

  list(roomId: string): Promise<RoomImage[]> {
    return apiFetch<RoomImage[]>(`/api/rooms/${roomId}/images`)
  },

  remove(roomId: string, imageId: string): Promise<void> {
    return apiFetch<void>(`/api/rooms/${roomId}/images/${imageId}`, {
      method: 'DELETE',
    })
  },

  setPrimary(roomId: string, imageId: string): Promise<RoomImage> {
    return apiFetch<RoomImage>(
      `/api/rooms/${roomId}/images/${imageId}/primary`,
      { method: 'PATCH' },
    )
  },
}
