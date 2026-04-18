import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import type { UserResponse } from '@/features/user/api/user-api'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const ch = createColumnHelper<UserResponse>()

type Props = {
  users: UserResponse[]
  onSelect?: (userId: string) => void
}

export function UserTableView({ users, onSelect }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])

  const columns = useMemo(
    () => [
      ch.accessor('email', {
        header: '이메일',
        cell: (info) => (
          <span className="font-medium tracking-[-0.01em]">{info.getValue()}</span>
        ),
      }),
      ch.accessor('name', {
        header: '이름',
        cell: (info) => info.getValue(),
        size: 160,
      }),
      ch.accessor('createdAt', {
        header: '가입일',
        cell: (info) => (
          <span className="tabular-nums text-[var(--muted)]">
            {dateFormatter.format(new Date(info.getValue()))}
          </span>
        ),
        size: 180,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => row.userId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (users.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-sm text-[var(--muted)]">
        관리자 계정이 없습니다.
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
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={[
                      'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]',
                      canSort ? 'cursor-pointer select-none' : '',
                    ].join(' ')}
                    onClick={
                      canSort ? header.column.getToggleSortingHandler() : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
              onClick={() => onSelect?.(row.original.userId)}
              className={[
                'border-t border-[var(--border)] transition hover:bg-[var(--control)]',
                onSelect ? 'cursor-pointer' : '',
              ].join(' ')}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className="px-3 py-2"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
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
