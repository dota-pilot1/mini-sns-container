import { useMutation, useQueryClient } from '@tanstack/react-query'

import { contractApi } from '@/features/contract/api/contract-api'

type Vars = { contractId: string; terminationDate?: string }

export function useTerminateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, terminationDate }: Vars) =>
      contractApi.terminate(contractId, terminationDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}
