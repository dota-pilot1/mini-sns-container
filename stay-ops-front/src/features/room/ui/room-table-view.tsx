import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import type { RoomResponse } from '@/features/room/api/room-api'
import {
  ROOM_OPTION_LABEL,
  ROOM_STATUS_ORDER,
  ROOM_TYPE_LABEL,
} from '@/features/room/model/room-types'
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

export function RoomTableView({ rooms }: { rooms: RoomResponse[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'roomNumber', desc: false },
  ])

  const columns = useMemo<ColumnDef<RoomResponse, unknown>[]>(
    () => [
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
      ch.accessor('roomType', {
        header: '타입',
        cell: (info) => ROOM_TYPE_LABEL[info.getValue()],
        size: 80,
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
    [],
  )

  const table = useReactTable({
    data: rooms,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (rooms.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-sm text-[var(--muted)]">
        조건에 맞는 방이 없습니다.
      </div>
    )
  }

  return (
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
              className="border-t border-[var(--border)] transition hover:bg-[var(--control)]"
            >
              {row.getVisibleCells().map((cell) => {
                const align =
                  (cell.column.columnDef.meta as { align?: string } | undefined)
                    ?.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                return (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className={['px-3 py-2', align].join(' ')}
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
