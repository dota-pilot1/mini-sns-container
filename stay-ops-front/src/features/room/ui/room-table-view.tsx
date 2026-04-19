import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import type { RoomPaymentStatusMap } from '@/features/payment/model/use-room-payment-status'
import { PaymentStatusPill } from '@/features/payment/ui/payment-status-pill'
import type { RoomResponse } from '@/features/room/api/room-api'
import {
  ROOM_OPTION_LABEL,
  ROOM_STATUS_ORDER,
} from '@/features/room/model/room-types'
import { RoomBulkActionBar } from '@/features/room/ui/room-bulk-action-bar'
import { RoomStatusBadge } from '@/features/room/ui/room-status-badge'

const krw = new Intl.NumberFormat('ko-KR')
const relativeTime = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })

const ch = createColumnHelper<RoomResponse>()

function relative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const minutes = diffMs / 60_000
  if (Math.abs(minutes) < 60) return relativeTime.format(Math.round(minutes), 'minute')
  const hours = minutes / 60
  if (Math.abs(hours) < 24) return relativeTime.format(Math.round(hours), 'hour')
  const days = hours / 24
  if (Math.abs(days) < 30) return relativeTime.format(Math.round(days), 'day')
  const months = days / 30
  return relativeTime.format(Math.round(months), 'month')
}

type Props = {
  rooms: RoomResponse[]
  paymentStatusByRoomId?: RoomPaymentStatusMap
  paymentPeriod?: string
  onSelect?: (roomId: string) => void
}

export function RoomTableView({
  rooms,
  paymentStatusByRoomId,
  paymentPeriod,
  onSelect,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'roomNumber', desc: false },
  ])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columns = useMemo<ColumnDef<RoomResponse, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="전체 선택"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={(v) => row.toggleSelected(!!v)}
            aria-label={`${row.original.roomNumber} 선택`}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        id: 'thumbnail',
        header: '',
        cell: ({ row }) => {
          const url = row.original.primaryImageUrl
          return (
            <div className="h-10 w-10 overflow-hidden rounded-md bg-[var(--control)]">
              {url ? (
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          )
        },
        enableSorting: false,
        size: 56,
      },
      ch.accessor('roomNumber', {
        header: '호수',
        cell: (info) => (
          <span className="font-semibold tracking-[-0.01em]">
            {info.getValue()}
          </span>
        ),
        size: 80,
      }),
      ch.accessor('floor', {
        header: '층',
        cell: (info) => `${info.getValue()}F`,
        size: 60,
      }),
      ch.accessor('sizePyeong', {
        header: () => <span className="w-full text-right">평수</span>,
        cell: (info) => (
          <span className="tabular-nums">{Number(info.getValue())}평</span>
        ),
        size: 70,
        meta: { align: 'right' },
      }),
      ch.accessor('monthlyRent', {
        header: () => <span className="w-full text-right">월세</span>,
        cell: (info) => (
          <span className="tabular-nums">{krw.format(info.getValue())}원</span>
        ),
        size: 120,
        meta: { align: 'right' },
      }),
      ch.accessor('deposit', {
        header: () => <span className="w-full text-right">보증금</span>,
        cell: (info) => (
          <span className="tabular-nums">{krw.format(info.getValue())}원</span>
        ),
        size: 130,
        meta: { align: 'right' },
      }),
      ch.accessor('status', {
        header: '상태',
        cell: (info) => <RoomStatusBadge status={info.getValue()} />,
        sortingFn: (a, b) =>
          ROOM_STATUS_ORDER.indexOf(a.original.status) -
          ROOM_STATUS_ORDER.indexOf(b.original.status),
        size: 80,
      }),
      {
        id: 'paymentStatus',
        header: '결제',
        cell: ({ row }) => {
          const ps = paymentStatusByRoomId?.[row.original.roomId]
          if (!ps) return <span className="text-[var(--muted)]">—</span>
          return (
            <PaymentStatusPill
              status={ps}
              title={
                paymentPeriod
                  ? `${paymentPeriod} ${ps === 'PAID' ? '완납' : ps === 'OVERDUE' ? '미납' : '환불됨'}`
                  : undefined
              }
            />
          )
        },
        enableSorting: false,
        size: 80,
      },
      ch.accessor('options', {
        header: '옵션',
        cell: (info) => {
          const opts = info.getValue()
          if (opts.length === 0) {
            return <span className="text-[var(--muted)]">—</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {opts.map((o) => (
                <span
                  key={o}
                  className="inline-flex items-center rounded bg-[var(--control)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]"
                >
                  {ROOM_OPTION_LABEL[o]}
                </span>
              ))}
            </div>
          )
        },
        enableSorting: false,
        size: 200,
      }),
      ch.accessor('updatedAt', {
        header: '업데이트',
        cell: (info) => (
          <span className="text-xs text-[var(--muted)]">
            {relative(info.getValue())}
          </span>
        ),
        size: 100,
      }),
    ],
    [paymentStatusByRoomId, paymentPeriod],
  )

  const table = useReactTable({
    data: rooms,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.roomId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])

  if (rooms.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-sm text-[var(--muted)]">
        조건에 맞는 방이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--surface)] shadow-[0_1px_0_var(--border)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sort = header.column.getIsSorted()
                  const align =
                    (header.column.columnDef.meta as { align?: string } | undefined)
                      ?.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={[
                        'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]',
                        align,
                        canSort ? 'cursor-pointer select-none' : '',
                      ].join(' ')}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort ? (
                          <SortIcon
                            dir={sort === 'asc' ? 'asc' : sort === 'desc' ? 'desc' : null}
                          />
                        ) : null}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={[
                  'border-t border-[var(--border)] transition hover:bg-[var(--control)]',
                  row.getIsSelected() ? 'bg-[var(--ring)]/20' : '',
                ].join(' ')}
              >
                {row.getVisibleCells().map((cell) => {
                  const align =
                    (cell.column.columnDef.meta as { align?: string } | undefined)
                      ?.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  const isSelectCell = cell.column.id === 'select'
                  return (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      onClick={
                        isSelectCell
                          ? (e) => e.stopPropagation()
                          : () => onSelect?.(row.original.roomId)
                      }
                      className={[
                        'px-3 py-2',
                        align,
                        isSelectCell ? '' : onSelect ? 'cursor-pointer' : '',
                      ].join(' ')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 ? (
        <RoomBulkActionBar
          selectedIds={selectedIds}
          onClear={() => setRowSelection({})}
        />
      ) : null}
    </div>
  )
}

/* ───── primitives ───── */

function Checkbox({
  checked,
  onChange,
  ...rest
}: {
  checked: boolean | 'indeterminate'
  onChange: (next: boolean) => void
} & React.HTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      checked={checked === true}
      ref={(el) => {
        if (el) el.indeterminate = checked === 'indeterminate'
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
      {...rest}
    />
  )
}

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={dir ? 'opacity-100' : 'opacity-30'}
    >
      <path
        d="M5 1 L8 4 L2 4 Z"
        className={dir === 'asc' ? 'fill-current' : 'fill-current opacity-50'}
      />
      <path
        d="M5 9 L8 6 L2 6 Z"
        className={dir === 'desc' ? 'fill-current' : 'fill-current opacity-50'}
      />
    </svg>
  )
}
