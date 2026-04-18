import { useQuery } from '@tanstack/react-query'

import { roomApi, type ListRoomsParams } from '@/features/room/api/room-api'

export const roomsQueryKey = (params: ListRoomsParams) =>
  ['rooms', params] as const

export function useRoomsQuery(params: ListRoomsParams = {}) {
  return useQuery({
    queryKey: roomsQueryKey(params),
    queryFn: () => roomApi.list(params),
  })
}
