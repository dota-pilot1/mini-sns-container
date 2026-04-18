import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  tenantApi,
  type TenantResponse,
  type UpdateTenantPayload,
} from '@/features/tenant/api/tenant-api'

type Vars = { tenantId: string; body: UpdateTenantPayload }

export function useUpdateTenant() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, body }: Vars) => tenantApi.update(tenantId, body),

    onSuccess: (updated) => {
      const snapshots = qc.getQueriesData<TenantResponse[]>({ queryKey: ['tenants'] })
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<TenantResponse[]>(
          key,
          value.map((t) => (t.tenantId === updated.tenantId ? updated : t)),
        )
      }
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
