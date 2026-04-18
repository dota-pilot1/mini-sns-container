import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type {
  TenantResponse,
  UpdateTenantPayload,
} from '@/features/tenant/api/tenant-api'
import { ApiError } from '@/shared/api/types'

const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/

const tenantFormSchema = z.object({
  name: z.string().trim().min(1, '이름은 필수입니다.').max(50, '이름은 50자 이하여야 합니다.'),
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, '01X-XXXX-XXXX 형식으로 입력해주세요.'),
  memo: z.string().max(500, '메모는 500자 이하여야 합니다.').optional(),
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>

type Props = {
  initial: TenantResponse
  onSubmit: (payload: UpdateTenantPayload) => Promise<unknown>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

export function TenantForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = '저장',
}: Props) {
  const defaultValues: TenantFormValues = {
    name: initial.name,
    phoneNumber: initial.phoneNumber,
    memo: initial.memo ?? '',
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    mode: 'onTouched',
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.tenantId])

  const submit = handleSubmit(async (values) => {
    const payload: UpdateTenantPayload = {
      name: values.name.trim(),
      phoneNumber: values.phoneNumber,
      memo: values.memo?.trim() ? values.memo.trim() : null,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        for (const fe of err.fieldErrors) {
          if (fe.field in values) {
            setError(fe.field as keyof TenantFormValues, {
              type: 'server',
              message: fe.message,
            })
          }
        }
        return
      }
      throw err
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="이름" error={errors.name?.message}>
        <input {...register('name')} autoComplete="off" className={inputCls} />
      </Field>
      <Field label="연락처" error={errors.phoneNumber?.message}>
        <input
          {...register('phoneNumber')}
          inputMode="tel"
          autoComplete="off"
          className={inputCls}
        />
      </Field>
      <Field label="메모" error={errors.memo?.message}>
        <textarea
          {...register('memo')}
          rows={3}
          className={[inputCls, 'resize-none'].join(' ')}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || !isDirty}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? '저장 중…' : submitLabel}
        </button>
      </div>
    </form>
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
