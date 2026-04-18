import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  tenantApi,
  type CreateTenantPayload,
  type TenantResponse,
} from '@/features/tenant/api/tenant-api'

export function useCreateTenant() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateTenantPayload) => tenantApi.create(body),

    onSuccess: (created) => {
      const snapshots = qc.getQueriesData<TenantResponse[]>({ queryKey: ['tenants'] })
      for (const [key, value] of snapshots) {
        if (!value) continue
        qc.setQueryData<TenantResponse[]>(key, [created, ...value])
      }
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}
