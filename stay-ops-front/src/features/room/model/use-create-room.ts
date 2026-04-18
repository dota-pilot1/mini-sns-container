import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  roomApi,
  type CreateRoomPayload,
  type RoomResponse,
} from '@/features/room/api/room-api'

/**
 * 방 등록 mutation. 서버 응답을 모든 rooms 리스트 캐시 앞쪽에 추가하여
 * 즉시 UI 반영, 이어서 invalidate 로 정합성 맞춤.
 */
export function useCreateRoom() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateRoomPayload) => roomApi.create(body),

    onSuccess: (created) => {
      const snapshots = qc.getQueriesData<RoomResponse[]>({ queryKey: ['rooms'] })
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<RoomResponse[]>(key, [created, ...value])
      }
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
