export const ROOM_STATUSES = [
  'VACANT',
  'RESERVED',
  'OCCUPIED',
  'CLEANING',
  'MAINTENANCE',
] as const
export type RoomStatus = (typeof ROOM_STATUSES)[number]

export const ROOM_OPTIONS = [
  'AIRCON',
  'PRIVATE_BATH',
  'WINDOW',
  'REFRIGERATOR',
  'DESK',
] as const
export type RoomOption = (typeof ROOM_OPTIONS)[number]

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  VACANT: '공실',
  RESERVED: '예약',
  OCCUPIED: '입실',
  CLEANING: '청소',
  MAINTENANCE: '문제',
}

/**
 * 사이드바 상태 섹션 노출 순서 (운영 우선순위: 긴급도 높은 순).
 */
export const ROOM_STATUS_ORDER: RoomStatus[] = [
  'VACANT',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'CLEANING',
]

/**
 * 사이드바/칩용 도트 색상 (배지 bg 와 통일감).
 */
export const ROOM_STATUS_DOT: Record<RoomStatus, string> = {
  VACANT: 'bg-emerald-500',
  RESERVED: 'bg-amber-500',
  OCCUPIED: 'bg-sky-500',
  CLEANING: 'bg-slate-500',
  MAINTENANCE: 'bg-rose-500',
}

export const ROOM_OPTION_LABEL: Record<RoomOption, string> = {
  AIRCON: '에어컨',
  PRIVATE_BATH: '개인욕실',
  WINDOW: '창문',
  REFRIGERATOR: '냉장고',
  DESK: '책상',
}

/**
 * 상태 배지 색상 — Tailwind 유틸로 직접 지정 (var(--...) 토큰과 충돌 방지).
 */
export const ROOM_STATUS_BADGE: Record<RoomStatus, string> = {
  VACANT: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  RESERVED: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  OCCUPIED: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  CLEANING: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  MAINTENANCE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}
