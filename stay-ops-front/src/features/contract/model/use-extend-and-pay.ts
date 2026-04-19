import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  contractApi,
  type ExtendAndPayPayload,
} from '@/features/contract/api/contract-api'

type Vars = { contractId: string; body: ExtendAndPayPayload }

export function useExtendAndPay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, body }: Vars) => contractApi.extendAndPay(contractId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}
