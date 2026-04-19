import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomImageApi } from '@/features/room/api/room-image-api'
import { roomImagesQueryKey } from '@/features/room/model/use-room-images'

type Variables = { roomId: string; imageId: string }

export function useDeleteRoomImage() {
  const qc = useQueryClient()

  return useMutation<void, Error, Variables>({
    mutationFn: ({ roomId, imageId }) => roomImageApi.remove(roomId, imageId),
    onSuccess: (_void, { roomId }) => {
      qc.invalidateQueries({ queryKey: roomImagesQueryKey(roomId) })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
