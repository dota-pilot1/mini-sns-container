import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomApi, type RoomResponse } from '@/features/room/api/room-api'

/**
 * 방 삭제 mutation (서버 soft delete).
 * 낙관적 업데이트로 리스트/카운트에서 즉시 제거, 실패 시 롤백.
 */
export function useDeleteRoom() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (roomId: string) => roomApi.remove(roomId),

    onMutate: async (roomId) => {
      await qc.cancelQueries({ queryKey: ['rooms'] })
      const snapshots = qc.getQueriesData<RoomResponse[]>({ queryKey: ['rooms'] })

      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<RoomResponse[]>(
          key,
          value.filter((r) => r.roomId !== roomId),
        )
      }

      return { snapshots }
    },

    onError: (_err, _id, ctx) => {
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
