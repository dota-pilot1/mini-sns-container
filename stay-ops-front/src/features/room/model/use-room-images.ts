import { useQuery } from '@tanstack/react-query'

import { roomImageApi } from '@/features/room/api/room-image-api'

export const roomImagesQueryKey = (roomId: string) =>
  ['rooms', roomId, 'images'] as const

export function useRoomImagesQuery(roomId: string | null | undefined) {
  return useQuery({
    queryKey: roomImagesQueryKey(roomId ?? ''),
    queryFn: () => roomImageApi.list(roomId as string),
    enabled: !!roomId,
  })
}
