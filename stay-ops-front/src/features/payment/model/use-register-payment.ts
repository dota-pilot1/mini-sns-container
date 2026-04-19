import { useMutation, useQueryClient } from '@tanstack/react-query'

import { paymentApi, type RegisterPaymentPayload } from '@/features/payment/api/payment-api'

export function useRegisterPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterPaymentPayload) => paymentApi.register(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}
