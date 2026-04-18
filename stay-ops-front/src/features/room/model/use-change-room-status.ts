import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomApi, type RoomResponse } from '@/features/room/api/room-api'
import type { RoomStatus } from '@/features/room/model/room-types'

type Vars = { roomId: string; status: RoomStatus }

/**
 * 방 상태 변경 mutation — 성공 시 낙관적 업데이트로 드로어/리스트를 즉시 반영,
 * 실패 시 롤백 후 전체 목록 재조회.
 */
export function useChangeRoomStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, status }: Vars) =>
      roomApi.changeStatus(roomId, status),

    onMutate: async ({ roomId, status }) => {
      await qc.cancelQueries({ queryKey: ['rooms'] })
      const snapshots = qc.getQueriesData<RoomResponse[]>({ queryKey: ['rooms'] })

      // 모든 rooms 캐시에 동일 roomId 항목 상태만 교체
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<RoomResponse[]>(
          key,
          value.map((r) => (r.roomId === roomId ? { ...r, status } : r)),
        )
      }

      return { snapshots }
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx?.snapshots) return
      for (const [key, value] of ctx.snapshots) {
        qc.setQueryData(key, value)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
