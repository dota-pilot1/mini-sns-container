import { useQuery } from '@tanstack/react-query'

import { contractApi, type ListContractsParams } from '@/features/contract/api/contract-api'

export const contractsQueryKey = (params: ListContractsParams) =>
  ['contracts', params] as const

export function useContractsQuery(params: ListContractsParams = {}) {
  return useQuery({
    queryKey: contractsQueryKey(params),
    queryFn: () => contractApi.list(params),
  })
}
