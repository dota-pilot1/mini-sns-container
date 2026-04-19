import { useMutation, useQueryClient } from '@tanstack/react-query'

import { paymentApi, type RefundPaymentPayload } from '@/features/payment/api/payment-api'

export function useRefundPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RefundPaymentPayload) => paymentApi.refund(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}
