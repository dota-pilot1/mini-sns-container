import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomImageApi } from '@/features/room/api/room-image-api'
import type { RoomImage } from '@/features/room/model/room-image-types'
import { roomImagesQueryKey } from '@/features/room/model/use-room-images'

type Variables = { roomId: string; imageId: string }

export function useSetPrimaryRoomImage() {
  const qc = useQueryClient()

  return useMutation<RoomImage, Error, Variables>({
    mutationFn: ({ roomId, imageId }) => roomImageApi.setPrimary(roomId, imageId),
    onSuccess: (_image, { roomId }) => {
      qc.invalidateQueries({ queryKey: roomImagesQueryKey(roomId) })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
