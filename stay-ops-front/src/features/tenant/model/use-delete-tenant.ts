import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantApi, type TenantResponse } from '@/features/tenant/api/tenant-api'

export function useDeleteTenant() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (tenantId: string) => tenantApi.remove(tenantId),

    onSuccess: (_void, tenantId) => {
      const snapshots = qc.getQueriesData<TenantResponse[]>({ queryKey: ['tenants'] })
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<TenantResponse[]>(
          key,
          value.filter((t) => t.tenantId !== tenantId),
        )
      }
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
