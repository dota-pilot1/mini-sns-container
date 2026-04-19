import { useMutation, useQueryClient } from '@tanstack/react-query'

import { paymentApi } from '@/features/payment/api/payment-api'

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => paymentApi.remove(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}
