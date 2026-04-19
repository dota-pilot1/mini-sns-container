import { useQuery } from '@tanstack/react-query'

import { roomApi } from '@/features/room/api/room-api'

export const roomDetailQueryKey = (roomId: string) =>
  ['rooms', 'detail', roomId] as const

export function useRoomQuery(roomId: string | null | undefined) {
  return useQuery({
    queryKey: roomDetailQueryKey(roomId ?? ''),
    queryFn: () => roomApi.get(roomId as string),
    enabled: !!roomId,
  })
}
