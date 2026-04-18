import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  roomApi,
  type RoomResponse,
  type UpdateRoomPayload,
} from '@/features/room/api/room-api'

type Vars = { roomId: string; body: UpdateRoomPayload }

/**
 * 방 수정 mutation. 서버 응답으로 캐시 갱신.
 * (낙관적 업데이트는 필드가 많아 유지 비용이 크므로, 응답 반영 방식으로 단순화)
 */
export function useUpdateRoom() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, body }: Vars) => roomApi.update(roomId, body),

    onSuccess: (updated) => {
      // 모든 rooms 리스트 캐시에서 해당 roomId 를 교체
      const snapshots = qc.getQueriesData<RoomResponse[]>({ queryKey: ['rooms'] })
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<RoomResponse[]>(
          key,
          value.map((r) => (r.roomId === updated.roomId ? updated : r)),
        )
      }
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
