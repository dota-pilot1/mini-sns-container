import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomImageApi } from '@/features/room/api/room-image-api'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  type RoomImage,
} from '@/features/room/model/room-image-types'
import { roomImagesQueryKey } from '@/features/room/model/use-room-images'

type Variables = { roomId: string; file: File }

function validate(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type || '(unknown)'}`)
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`파일 크기가 허용 범위를 벗어났습니다 (최대 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`)
  }
}

/**
 * 한 파일에 대해 presign → S3 PUT → register 를 순서대로 실행.
 * 여러 파일은 호출 측에서 `Promise.allSettled` 로 병렬 처리한다.
 */
export function useUploadRoomImage() {
  const qc = useQueryClient()

  return useMutation<RoomImage, Error, Variables>({
    mutationFn: async ({ roomId, file }) => {
      validate(file)
      const { key, uploadUrl } = await roomImageApi.presign({
        scope: 'room',
        refId: roomId,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      })
      await roomImageApi.uploadToS3(uploadUrl, file)
      return roomImageApi.register(roomId, key)
    },
    onSuccess: (_image, { roomId }) => {
      qc.invalidateQueries({ queryKey: roomImagesQueryKey(roomId) })
      // 목록 썸네일 재갱신 (08 에서 primaryImageUrl 이 추가되면 의미 있어짐).
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
