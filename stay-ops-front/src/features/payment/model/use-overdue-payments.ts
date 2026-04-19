import { useQuery } from '@tanstack/react-query'

import { paymentApi } from '@/features/payment/api/payment-api'

export const overduePaymentsQueryKey = (period: string) =>
  ['payments', 'overdue', period] as const

export function useOverduePaymentsQuery(period: string) {
  return useQuery({
    queryKey: overduePaymentsQueryKey(period),
    queryFn: () => paymentApi.overdue(period),
    enabled: Boolean(period),
  })
}
