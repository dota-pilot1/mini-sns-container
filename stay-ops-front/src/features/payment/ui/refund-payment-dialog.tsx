import { useEffect, useState } from 'react'

import { useRefundPayment } from '@/features/payment/model/use-refund-payment'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

export type RefundTarget = {
  paymentId: string
  periodYearMonth: string
  amount: number
  defaultNote?: string | null
}

type Props = {
  target: RefundTarget | null
  onClose: () => void
  onRefunded?: () => void
}

const numberFmt = new Intl.NumberFormat('ko-KR')

export function RefundPaymentDialog({ target, onClose, onRefunded }: Props) {
  const open = target !== null
  const refund = useRefundPayment()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (target) {
      setNote(target.defaultNote ?? '')
      setError(null)
    }
  }, [target])

  const submit = async () => {
    if (!target) return
    setError(null)
    try {
      await refund.mutateAsync({
        paymentId: target.paymentId,
        note: note.trim() ? note.trim() : undefined,
      })
      onRefunded?.()
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '환불 처리에 실패했습니다.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => (refund.isPending ? undefined : onClose())}
      ariaLabel="환불 처리"
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col gap-3 p-5">
        <h2 className="text-base font-bold tracking-[-0.02em]">환불 처리</h2>
        {target ? (
          <p className="text-xs text-[var(--muted)]">
            {target.periodYearMonth} · {numberFmt.format(target.amount)}원
          </p>
        ) : null}
        <p className="text-sm text-[var(--muted)]">
          원본 레코드는 보존되고 상태만 환불로 변경됩니다.
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--muted)]">환불 사유 (선택)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="예: 4월 10일 중도 퇴실로 인한 환불"
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>

        {error ? <p className="text-xs text-rose-500">{error}</p> : null}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={refund.isPending}
            className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={refund.isPending}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
          >
            {refund.isPending ? '처리 중…' : '환불 처리'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
