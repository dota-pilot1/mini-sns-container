import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantApi, type TenantResponse } from '@/features/tenant/api/tenant-api'
import type { TenantStatus } from '@/features/tenant/model/tenant-types'

type Vars = { tenantId: string; status: TenantStatus }

/**
 * 입주자 상태 변경 mutation.
 * <p>
 * 칸반 드래그앤드롭과 상세 드로어 상태 칩에서 모두 호출. 낙관적 업데이트로 즉시 반영,
 * 실패 시 롤백. 레코드는 이동하지 않고 같은 행의 status 컬럼만 바뀐다 (교과서 DDD).
 */
export function useChangeTenantStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, status }: Vars) =>
      tenantApi.changeStatus(tenantId, status),

    onMutate: async ({ tenantId, status }) => {
      await qc.cancelQueries({ queryKey: ['tenants'] })
      const snapshots = qc.getQueriesData<TenantResponse[]>({ queryKey: ['tenants'] })

      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<TenantResponse[]>(
          key,
          value.map((t) => (t.tenantId === tenantId ? { ...t, status } : t)),
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
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
