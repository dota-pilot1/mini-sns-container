import { apiFetch } from '@/shared/api/client'

import type { PaymentMethod, PaymentStatus } from '@/features/payment/model/payment-types'

export type PaymentResponse = {
  id: string
  contractId: string
  periodYearMonth: string
  amount: number
  paidAt: string
  method: PaymentMethod
  status: PaymentStatus
  refundedAt: string | null
  note: string | null
  createdAt: string
}

export type RegisterPaymentPayload = {
  contractId: string
  periodYearMonth: string
  amount: number
  paidAt?: string
  method: PaymentMethod
  note?: string
}

export type ListPaymentsParams = {
  contractId?: string
  period?: string
  fromPeriod?: string
  toPeriod?: string
  status?: PaymentStatus
}

export type OverduePaymentResponse = {
  contractId: string
  tenantId: string
  tenantName: string
  roomId: string
  roomNumber: string
  expectedAmount: number
  daysOverdue: number
}

function buildQuery(params: ListPaymentsParams): string {
  const entries: [string, string][] = []
  if (params.contractId) entries.push(['contractId', params.contractId])
  if (params.period) entries.push(['period', params.period])
  if (params.fromPeriod) entries.push(['fromPeriod', params.fromPeriod])
  if (params.toPeriod) entries.push(['toPeriod', params.toPeriod])
  if (params.status) entries.push(['status', params.status])
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

export const paymentApi = {
  list(params: ListPaymentsParams = {}): Promise<PaymentResponse[]> {
    return apiFetch<PaymentResponse[]>(`/api/payments${buildQuery(params)}`)
  },
  overdue(period: string): Promise<OverduePaymentResponse[]> {
    return apiFetch<OverduePaymentResponse[]>(
      `/api/payments/overdue?${new URLSearchParams({ period }).toString()}`,
    )
  },
  register(body: RegisterPaymentPayload): Promise<PaymentResponse> {
    return apiFetch<PaymentResponse>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  remove(paymentId: string): Promise<void> {
    return apiFetch<void>(`/api/payments/${paymentId}`, { method: 'DELETE' })
  },
}
