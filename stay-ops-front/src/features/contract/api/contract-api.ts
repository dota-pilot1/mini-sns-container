import { apiFetch } from '@/shared/api/client'

import type { ContractStatus } from '@/features/contract/model/contract-types'

export type ContractResponse = {
  contractId: string
  tenantId: string
  roomId: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  status: ContractStatus
  previousContractId: string | null
  createdAt: string
  updatedAt: string
}

export type CreateContractPayload = {
  tenantId: string
  roomId: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
}

export type ExtendAndPayPayload = {
  months: number
  amountPerMonth?: number
  method?: 'CARD' | 'CASH' | 'BANK_TRANSFER'
  note?: string
}

export type ExtendAndPayResponse = {
  contract: ContractResponse
  paymentIds: string[]
  totalAmount: number
}

export type CancelOccupancyPayload = {
  moveOutDate?: string
  refundDeposit?: boolean
}

export type CancelOccupancyResponse = {
  contract: ContractResponse
  refundedPaymentIds: string[]
  refundedTotal: number
  usedAmount: number
  depositRefunded: number
}

export type ListContractsParams = {
  tenantId?: string
  roomId?: string
  status?: ContractStatus
}

function buildQuery(params: ListContractsParams): string {
  const entries: [string, string][] = []
  if (params.tenantId) entries.push(['tenantId', params.tenantId])
  if (params.roomId) entries.push(['roomId', params.roomId])
  if (params.status) entries.push(['status', params.status])
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

export const contractApi = {
  list(params: ListContractsParams = {}): Promise<ContractResponse[]> {
    return apiFetch<ContractResponse[]>(`/api/contracts${buildQuery(params)}`)
  },
  get(contractId: string): Promise<ContractResponse> {
    return apiFetch<ContractResponse>(`/api/contracts/${contractId}`)
  },
  create(body: CreateContractPayload): Promise<ContractResponse> {
    return apiFetch<ContractResponse>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  terminate(contractId: string, terminationDate?: string): Promise<ContractResponse> {
    return apiFetch<ContractResponse>(`/api/contracts/${contractId}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ terminationDate: terminationDate ?? null }),
    })
  },
  extendAndPay(contractId: string, body: ExtendAndPayPayload): Promise<ExtendAndPayResponse> {
    return apiFetch<ExtendAndPayResponse>(`/api/contracts/${contractId}/extend-and-pay`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  cancelOccupancy(
    contractId: string,
    body: CancelOccupancyPayload = {},
  ): Promise<CancelOccupancyResponse> {
    return apiFetch<CancelOccupancyResponse>(`/api/contracts/${contractId}/cancel-occupancy`, {
      method: 'POST',
      body: JSON.stringify({
        moveOutDate: body.moveOutDate ?? null,
        refundDeposit: body.refundDeposit ?? false,
      }),
    })
  },
  remove(contractId: string): Promise<void> {
    return apiFetch<void>(`/api/contracts/${contractId}`, { method: 'DELETE' })
  },
}
