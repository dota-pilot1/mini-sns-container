export const CONTRACT_STATUSES = ['ACTIVE', 'TERMINATED', 'EXPIRED'] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  ACTIVE: '거주중',
  TERMINATED: '퇴실',
  EXPIRED: '만료',
}
