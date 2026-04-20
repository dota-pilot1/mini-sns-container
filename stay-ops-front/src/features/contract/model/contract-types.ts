import type { ContractResponse } from '@/features/contract/api/contract-api'

/**
 * 계약의 파생 상태 — 저장되지 않고 `cancelledAt` + 날짜로 계산된다.
 * - CANCELLED: `cancelledAt` 있음 (퇴실 처리됨)
 * - UPCOMING: 시작일 이전 (예정)
 * - EFFECTIVE: 오늘이 startDate~endDate 범위 내 (거주중)
 * - OVERDUE: endDate 지났지만 아직 퇴실 처리 안 됨 (연체)
 */
export type DerivedContractState = 'UPCOMING' | 'EFFECTIVE' | 'OVERDUE' | 'CANCELLED'

export const DERIVED_CONTRACT_STATE_LABEL: Record<DerivedContractState, string> = {
  UPCOMING: '예정',
  EFFECTIVE: '거주중',
  OVERDUE: '연체',
  CANCELLED: '퇴실',
}

type ContractLike = Pick<ContractResponse, 'startDate' | 'endDate'> & {
  cancelledAt?: string | null
}

export function deriveContractState(
  contract: ContractLike,
  today: string = todayLocalISO(),
): DerivedContractState {
  if (contract.cancelledAt) return 'CANCELLED'
  if (today < contract.startDate) return 'UPCOMING'
  if (today > contract.endDate) return 'OVERDUE'
  return 'EFFECTIVE'
}

export function isEffective(
  contract: ContractLike,
  today: string = todayLocalISO(),
): boolean {
  return deriveContractState(contract, today) === 'EFFECTIVE'
}

export function isOverdue(
  contract: ContractLike,
  today: string = todayLocalISO(),
): boolean {
  return deriveContractState(contract, today) === 'OVERDUE'
}

export function isCancelled(contract: ContractLike): boolean {
  return !!contract.cancelledAt
}

function todayLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}
