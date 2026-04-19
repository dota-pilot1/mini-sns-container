import { useMemo } from 'react'

import { useContractsQuery } from '@/features/contract/model/use-contracts'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'

export type RoomPaymentStatus = 'PAID' | 'OVERDUE' | 'REFUNDED_ONLY'
export type RoomPaymentStatusMap = Record<string, RoomPaymentStatus>

function thisMonthString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 방 ID 기준 이번 달 결제 상태 맵.
 * <p>
 * - PAID 가 있으면 'PAID'
 * - REFUNDED 만 있으면 'REFUNDED_ONLY'
 * - 둘 다 없으면 'OVERDUE'
 * - ACTIVE 계약 없는 방은 매핑 자체가 없음 (= 결제 개념 없음)
 *
 * 두 쿼리(active contracts + this month payments)를 한 번에 가져와서
 * 클라이언트에서 결합한다. 방 목록의 모든 카드/행이 N+1 호출 없이 공유한다.
 */
export function useRoomPaymentStatusMap(): {
  data: RoomPaymentStatusMap
  period: string
  isLoading: boolean
} {
  const period = thisMonthString()
  const { data: contracts = [], isLoading: contractsLoading } = useContractsQuery({
    status: 'ACTIVE',
  })
  const { data: payments = [], isLoading: paymentsLoading } = usePaymentsQuery({ period })

  const map = useMemo<RoomPaymentStatusMap>(() => {
    if (contracts.length === 0) return {}
    const out: RoomPaymentStatusMap = {}
    const paidContracts = new Set<string>()
    const refundedContracts = new Set<string>()
    for (const p of payments) {
      if (p.status === 'PAID') paidContracts.add(p.contractId)
      else if (p.status === 'REFUNDED') refundedContracts.add(p.contractId)
    }
    for (const c of contracts) {
      if (paidContracts.has(c.contractId)) {
        out[c.roomId] = 'PAID'
      } else if (refundedContracts.has(c.contractId)) {
        out[c.roomId] = 'REFUNDED_ONLY'
      } else {
        out[c.roomId] = 'OVERDUE'
      }
    }
    return out
  }, [contracts, payments])

  return {
    data: map,
    period,
    isLoading: contractsLoading || paymentsLoading,
  }
}
