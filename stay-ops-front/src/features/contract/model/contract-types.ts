import type { ContractResponse } from '@/features/contract/api/contract-api'

/**
 * 계약의 파생 상태 — 저장되지 않고 날짜로 계산된다.
 * - UPCOMING: 시작일 이전 (예정)
 * - EFFECTIVE: 오늘이 startDate~endDate 범위 내 (거주중)
 * - PAST: endDate 지남 (자연 만료든 중도 취소든)
 */
export type DerivedContractState = 'UPCOMING' | 'EFFECTIVE' | 'PAST'

export const DERIVED_CONTRACT_STATE_LABEL: Record<DerivedContractState, string> = {
  UPCOMING: '예정',
  EFFECTIVE: '거주중',
  PAST: '지난 계약',
}

export function deriveContractState(
  contract: Pick<ContractResponse, 'startDate' | 'endDate'>,
  today: string = todayLocalISO(),
): DerivedContractState {
  if (today < contract.startDate) return 'UPCOMING'
  if (today > contract.endDate) return 'PAST'
  return 'EFFECTIVE'
}

export function isEffective(
  contract: Pick<ContractResponse, 'startDate' | 'endDate'>,
  today: string = todayLocalISO(),
): boolean {
  return deriveContractState(contract, today) === 'EFFECTIVE'
}

function todayLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}
