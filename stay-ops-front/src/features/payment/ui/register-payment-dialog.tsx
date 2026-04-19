import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/features/payment/model/payment-types'
import { useRegisterPayment } from '@/features/payment/model/use-register-payment'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

const schema = z.object({
  amount: z.number().int().nonnegative('금액은 0 이상이어야 합니다.'),
  paidAt: z.string().min(1, '입금일은 필수입니다.'),
  method: z.enum(PAYMENT_METHODS),
  note: z.string().max(500, '메모는 500자 이하여야 합니다.').optional(),
})

type Values = z.infer<typeof schema>

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export type RegisterPaymentTarget = {
  contractId: string
  periodYearMonth: string
  defaultAmount: number
  tenantName?: string
  roomNumber?: string
}

type Props = {
  target: RegisterPaymentTarget | null
  onClose: () => void
  onCreated?: () => void
}

export function RegisterPaymentDialog({ target, onClose, onCreated }: Props) {
  const open = target !== null
  const register = useRegisterPayment()
  const [topError, setTopError] = useState<string | null>(null)

  const {
    register: rhf,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      amount: 0,
      paidAt: todayString(),
      method: 'BANK_TRANSFER',
      note: '',
    },
  })

  useEffect(() => {
    if (target) {
      reset({
        amount: target.defaultAmount,
        paidAt: todayString(),
        method: 'BANK_TRANSFER',
        note: '',
      })
      setTopError(null)
    }
  }, [target, reset])

  const submit = handleSubmit(async (values) => {
    if (!target) return
    setTopError(null)
    try {
      await register.mutateAsync({
        contractId: target.contractId,
        periodYearMonth: target.periodYearMonth,
        amount: values.amount,
        paidAt: new Date(values.paidAt).toISOString(),
        method: values.method as PaymentMethod,
        note: values.note?.trim() ? values.note.trim() : undefined,
      })
      onCreated?.()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        for (const fe of err.fieldErrors) {
          if (fe.field === 'amount' || fe.field === 'paidAt' || fe.field === 'method' || fe.field === 'note') {
            setError(fe.field as keyof Values, { type: 'server', message: fe.message })
          }
        }
        setTopError(err.message)
        return
      }
      setTopError(err instanceof Error ? err.message : '알 수 없는 오류')
    }
  })

  return (
    <Dialog
      open={open}
      onClose={() => (register.isPending ? undefined : onClose())}
      ariaLabel="입금 확인 등록"
      maxWidth="max-w-md"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">입금 확인</h2>
          {target ? (
            <p className="text-xs text-[var(--muted)]">
              {target.periodYearMonth}
              {target.tenantName ? ` · ${target.tenantName}` : ''}
              {target.roomNumber ? ` · ${target.roomNumber}호` : ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={register.isPending}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-5">
        <Field label="금액 (원)" error={errors.amount?.message}>
          <input
            type="number"
            inputMode="numeric"
            {...rhf('amount', { valueAsNumber: true })}
            className={inputCls}
          />
        </Field>

        <Field label="입금일" error={errors.paidAt?.message}>
          <input type="date" {...rhf('paidAt')} className={inputCls} />
        </Field>

        <Field label="수단" error={errors.method?.message}>
          <select {...rhf('method')} className={inputCls}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="메모" error={errors.note?.message}>
          <textarea
            {...rhf('note')}
            rows={3}
            placeholder="특이사항이 있다면…"
            className={[inputCls, 'resize-none'].join(' ')}
          />
        </Field>

        {topError ? <p className="text-xs text-rose-500">{topError}</p> : null}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={register.isPending}
            className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={register.isPending}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {register.isPending ? '등록 중…' : '입금 등록'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </label>
  )
}
