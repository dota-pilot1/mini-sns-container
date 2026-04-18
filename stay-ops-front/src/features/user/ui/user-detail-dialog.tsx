import type { UserResponse } from '@/features/user/api/user-api'
import { Dialog } from '@/shared/ui/dialog'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'long',
  timeStyle: 'short',
})

type Props = {
  user: UserResponse | null
  onClose: () => void
}

/**
 * 유저 상세 다이어로그.
 * v1: 읽기 전용. 수정/권한 조작은 Role 관리 도입 후 추가.
 */
export function UserDetailDialog({ user, onClose }: Props) {
  const open = user !== null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabel="유저 상세"
      maxWidth="max-w-md"
    >
      {user ? (
        <div className="flex flex-col gap-4 p-5">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
              {initials(user.name)}
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-bold tracking-[-0.02em]">
                {user.name}
              </h2>
              <p className="text-sm text-[var(--muted)]">{user.email}</p>
            </div>
          </header>

          <dl className="grid grid-cols-[5rem_1fr] gap-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <dt className="text-[var(--muted)]">유저 ID</dt>
            <dd className="truncate font-mono text-xs">{user.userId}</dd>
            <dt className="text-[var(--muted)]">가입일</dt>
            <dd className="tabular-nums">
              {dateFormatter.format(new Date(user.createdAt))}
            </dd>
          </dl>

          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)]"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
