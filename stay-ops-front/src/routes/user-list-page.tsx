import { useMemo, useState } from 'react'

import { useUsersQuery } from '@/features/user/model/use-users'
import { UserDetailDialog } from '@/features/user/ui/user-detail-dialog'
import { UserTableView } from '@/features/user/ui/user-table-view'

const PAGE_SIZE = 20

export function UserListPage() {
  const [page, setPage] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data, isLoading, isError, error, isPlaceholderData } = useUsersQuery({
    page,
    size: PAGE_SIZE,
  })

  const users = useMemo(() => data?.items ?? [], [data])
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  const selectedUser = useMemo(
    () =>
      selectedUserId ? users.find((u) => u.userId === selectedUserId) ?? null : null,
    [users, selectedUserId],
  )

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-[-0.03em]">관리자 계정</h1>
          <span className="text-xs text-[var(--muted)]">
            총 {totalElements.toLocaleString('ko-KR')}명
          </span>
        </div>
      </header>

      {isLoading ? (
        <SkeletonTable />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : '알 수 없는 오류'}
        />
      ) : (
        <>
          <UserTableView users={users} onSelect={setSelectedUserId} />
          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              disabled={isPlaceholderData}
              onChange={setPage}
            />
          ) : null}
        </>
      )}

      <UserDetailDialog
        user={selectedUser}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  disabled,
  onChange,
}: {
  page: number
  totalPages: number
  disabled: boolean
  onChange: (next: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <PageButton
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
      >
        이전
      </PageButton>
      <span className="px-2 text-sm tabular-nums text-[var(--muted)]">
        {page + 1} / {totalPages}
      </span>
      <PageButton
        disabled={disabled || page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </PageButton>
    </div>
  )
}

function PageButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function SkeletonTable() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface)]"
        />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 px-4 py-6 text-sm text-rose-600">
      관리자 목록을 불러오지 못했어요: {message}
    </div>
  )
}
