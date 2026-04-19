import { useMutation, useQueryClient } from '@tanstack/react-query'

import { contractApi } from '@/features/contract/api/contract-api'

export function useDeleteContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contractId: string) => contractApi.remove(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
