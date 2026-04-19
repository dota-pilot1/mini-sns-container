import { useQuery } from '@tanstack/react-query'

import { paymentApi, type ListPaymentsParams } from '@/features/payment/api/payment-api'

export const paymentsQueryKey = (params: ListPaymentsParams) =>
  ['payments', params] as const

export function usePaymentsQuery(
  params: ListPaymentsParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: paymentsQueryKey(params),
    queryFn: () => paymentApi.list(params),
    enabled: options.enabled ?? true,
  })
}
