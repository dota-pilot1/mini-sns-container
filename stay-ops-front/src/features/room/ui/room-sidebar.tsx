import type {
  RoomPaymentStatus,
  RoomPaymentStatusMap,
} from '@/features/payment/model/use-room-payment-status'
import type { RoomResponse } from '@/features/room/api/room-api'
import {
  ROOM_STATUS_DOT,
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
  type RoomStatus,
} from '@/features/room/model/room-types'

export type RoomFilter = {
  floor: number | null
  status: RoomStatus | null
  paymentStatus: RoomPaymentStatus | null
}

const PAYMENT_STATUS_ORDER: RoomPaymentStatus[] = ['OVERDUE', 'PAID', 'REFUNDED_ONLY']
const PAYMENT_STATUS_LABEL: Record<RoomPaymentStatus, string> = {
  OVERDUE: '미납',
  PAID: '완납',
  REFUNDED_ONLY: '환불',
}
const PAYMENT_STATUS_DOT: Record<RoomPaymentStatus, string> = {
  OVERDUE: 'bg-rose-500',
  PAID: 'bg-emerald-500',
  REFUNDED_ONLY: 'bg-amber-500',
}

type Props = {
  rooms: RoomResponse[]
  paymentStatusByRoomId: RoomPaymentStatusMap
  filter: RoomFilter
  onChange: (next: RoomFilter) => void
  onCreateClick?: () => void
}

export function RoomSidebar({
  rooms,
  paymentStatusByRoomId,
  filter,
  onChange,
  onCreateClick,
}: Props) {
  const total = rooms.length
  const byFloor = groupCount(rooms, (r) => r.floor)
  const byStatus = groupCount(rooms, (r) => r.status)
  const floors = Object.keys(byFloor)
    .map(Number)
    .sort((a, b) => b - a)

  const byPayment: Record<RoomPaymentStatus, number> = {
    PAID: 0,
    OVERDUE: 0,
    REFUNDED_ONLY: 0,
  }
  for (const r of rooms) {
    const ps = paymentStatusByRoomId[r.roomId]
    if (ps) byPayment[ps]++
  }
  const totalPaymentTracked = byPayment.PAID + byPayment.OVERDUE + byPayment.REFUNDED_ONLY

  const isAll =
    filter.floor === null && filter.status === null && filter.paymentStatus === null

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-5 border-r border-[var(--border)] bg-[var(--surface)] px-3 py-4">
      <div>
        <SidebarItem
          active={isAll}
          onClick={() => onChange({ floor: null, status: null, paymentStatus: null })}
        >
          <span className="font-semibold">전체</span>
          <Count>{total}</Count>
        </SidebarItem>
      </div>

      <Section label="층">
        {floors.map((f) => (
          <SidebarItem
            key={f}
            active={filter.floor === f}
            onClick={() =>
              onChange({
                ...filter,
                floor: filter.floor === f ? null : f,
              })
            }
          >
            <span>{f}층</span>
            <Count>{byFloor[f] ?? 0}</Count>
          </SidebarItem>
        ))}
      </Section>

      <Section label="입실 상태">
        {ROOM_STATUS_ORDER.map((s) => (
          <SidebarItem
            key={s}
            active={filter.status === s}
            onClick={() =>
              onChange({
                ...filter,
                status: filter.status === s ? null : s,
              })
            }
          >
            <span className="flex items-center gap-2">
              <span
                className={[
                  'inline-block h-2 w-2 rounded-full',
                  ROOM_STATUS_DOT[s],
                ].join(' ')}
              />
              {ROOM_STATUS_LABEL[s]}
            </span>
            <Count>{byStatus[s] ?? 0}</Count>
          </SidebarItem>
        ))}
      </Section>

      {totalPaymentTracked > 0 ? (
        <Section label="결제 상태">
          {PAYMENT_STATUS_ORDER.map((p) => (
            <SidebarItem
              key={p}
              active={filter.paymentStatus === p}
              onClick={() =>
                onChange({
                  ...filter,
                  paymentStatus: filter.paymentStatus === p ? null : p,
                })
              }
            >
              <span className="flex items-center gap-2">
                <span
                  className={[
                    'inline-block h-2 w-2 rounded-full',
                    PAYMENT_STATUS_DOT[p],
                  ].join(' ')}
                />
                {PAYMENT_STATUS_LABEL[p]}
              </span>
              <Count>{byPayment[p]}</Count>
            </SidebarItem>
          ))}
        </Section>
      ) : null}

      <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={onCreateClick}
          disabled={!onCreateClick}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + 방 등록
        </button>
      </div>
    </aside>
  )
}

/* ───── subcomponents ───── */

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function SidebarItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition',
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-[var(--foreground)] hover:bg-[var(--control)]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-xs font-medium opacity-70">{children}</span>
  )
}

/* ───── utils ───── */

function groupCount<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, number> {
  const out = {} as Record<K, number>
  for (const item of items) {
    const k = keyFn(item)
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}
