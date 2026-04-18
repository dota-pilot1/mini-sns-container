import { useQuery } from '@tanstack/react-query'

import { tenantApi, type ListTenantsParams } from '@/features/tenant/api/tenant-api'

export const tenantsQueryKey = (params: ListTenantsParams) =>
  ['tenants', params] as const

export function useTenantsQuery(params: ListTenantsParams = {}) {
  return useQuery({
    queryKey: tenantsQueryKey(params),
    queryFn: () => tenantApi.list(params),
  })
}
