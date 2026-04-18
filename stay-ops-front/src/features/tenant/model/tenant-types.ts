export const TENANT_STATUSES = ['RESERVED', 'ACTIVE', 'MOVED_OUT'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  RESERVED: '예약',
  ACTIVE: '거주중',
  MOVED_OUT: '퇴실',
}

/** 칸반 컬럼 노출 순서 (운영 흐름: 예약 → 거주 → 퇴실). */
export const TENANT_STATUS_ORDER: TenantStatus[] = ['RESERVED', 'ACTIVE', 'MOVED_OUT']

/** 사이드바/칩용 도트 색상. */
export const TENANT_STATUS_DOT: Record<TenantStatus, string> = {
  RESERVED: 'bg-amber-500',
  ACTIVE: 'bg-emerald-500',
  MOVED_OUT: 'bg-slate-400',
}

/** 상태 배지 색상 — Tailwind 유틸로 직접 지정. */
export const TENANT_STATUS_BADGE: Record<TenantStatus, string> = {
  RESERVED: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  ACTIVE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  MOVED_OUT: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
}
