import { useQuery } from '@tanstack/react-query'

import { tenantApi } from '@/features/tenant/api/tenant-api'

export const tenantsQueryKey = () => ['tenants'] as const

export function useTenantsQuery() {
  return useQuery({
    queryKey: tenantsQueryKey(),
    queryFn: () => tenantApi.list(),
  })
}
