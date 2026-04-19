import { useMutation, useQueryClient } from '@tanstack/react-query'

import { contractApi, type CreateContractPayload } from '@/features/contract/api/contract-api'

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContractPayload) => contractApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
