import type { ContractResponse } from '@/features/contract/api/contract-api'
import { CONTRACT_STATUS_LABEL } from '@/features/contract/model/contract-types'
import { Dialog } from '@/shared/ui/dialog'
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill'

const numberFmt = new Intl.NumberFormat('ko-KR')
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

const STATUS_TONE: Record<ContractResponse['status'], StatusTone> = {
  ACTIVE: 'emerald',
  TERMINATED: 'rose',
  EXPIRED: 'slate',
}

type Props = {
  open: boolean
  tenantName: string
  contracts: ContractResponse[]
  roomNumberById: Record<string, string>
  onClose: () => void
}

/**
 * 한 입주자의 모든 계약 이력을 read-only 로 보여준다.
 * 액션은 없음 — 액션은 입주자 드로어의 최근 계약 카드에서만 가능.
 */
export function ContractHistoryDialog({
  open,
  tenantName,
  contracts,
  roomNumberById,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} ariaLabel="계약 이력" maxWidth="max-w-md">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">계약 이력</h2>
          <p className="text-xs text-[var(--muted)]">
            {tenantName} · 총 {contracts.length}건
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)]"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2 px-5 py-4">
        {contracts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--control)] px-3 py-6 text-center text-xs text-[var(--muted)]">
            등록된 계약이 없습니다.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
            {contracts.map((c) => (
              <li
                key={c.contractId}
                className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {roomNumberById[c.roomId] ? `${roomNumberById[c.roomId]}호` : c.roomId.slice(0, 8)}
                  </span>
                  <StatusPill tone={STATUS_TONE[c.status]}>
                    {CONTRACT_STATUS_LABEL[c.status]}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>
                    {dateOnlyFmt.format(new Date(c.startDate))} ~{' '}
                    {dateOnlyFmt.format(new Date(c.endDate))}
                  </span>
                  <span className="tabular-nums">월 {numberFmt.format(c.monthlyRent)}원</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
