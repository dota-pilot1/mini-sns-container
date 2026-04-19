import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  contractApi,
  type CancelOccupancyPayload,
  type CancelOccupancyResponse,
} from '@/features/contract/api/contract-api'

type Vars = { contractId: string } & CancelOccupancyPayload

export function useCancelOccupancy() {
  const qc = useQueryClient()
  return useMutation<CancelOccupancyResponse, Error, Vars>({
    mutationFn: ({ contractId, ...body }) => contractApi.cancelOccupancy(contractId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
