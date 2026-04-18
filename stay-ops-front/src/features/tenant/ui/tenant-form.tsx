import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { RoomResponse } from '@/features/room/api/room-api'
import type {
  CreateTenantPayload,
  TenantResponse,
  UpdateTenantPayload,
} from '@/features/tenant/api/tenant-api'
import { ApiError } from '@/shared/api/types'

/* ───── schema ───── */

const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/

const tenantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름은 필수입니다.')
    .max(50, '이름은 50자 이하여야 합니다.'),
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, '01X-XXXX-XXXX 형식으로 입력해주세요.'),
  roomId: z.string().optional(),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),
  memo: z.string().max(500, '메모는 500자 이하여야 합니다.').optional(),
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>

/* ───── component ───── */

type Props = {
  /** edit 모드면 초기값 전달. undefined 면 create 모드. */
  initial?: TenantResponse
  rooms: RoomResponse[]
  onSubmit: (payload: CreateTenantPayload | UpdateTenantPayload) => Promise<unknown>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

export function TenantForm({
  initial,
  rooms,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
}: Props) {
  const isEdit = initial !== undefined

  const defaultValues: TenantFormValues = initial
    ? {
        name: initial.name,
        phoneNumber: initial.phoneNumber,
        roomId: initial.roomId ?? '',
        moveInDate: initial.moveInDate ?? '',
        moveOutDate: initial.moveOutDate ?? '',
        memo: initial.memo ?? '',
      }
    : {
        name: '',
        phoneNumber: '',
        roomId: '',
        moveInDate: '',
        moveOutDate: '',
        memo: '',
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
  }, [initial?.tenantId])

  const submit = handleSubmit(async (values) => {
    // 빈 문자열 → null/undefined 정리
    const roomId = values.roomId?.trim() ? values.roomId.trim() : null
    const moveInDate = values.moveInDate?.trim() || null
    const moveOutDate = values.moveOutDate?.trim() || null
    const memo = values.memo?.trim() ? values.memo.trim() : null

    // edit 모드에서 방 해제 의도 표현: 기존 값이 있었는데 빈 값으로 바뀜 → clearRoom=true
    const clearRoom = isEdit && initial?.roomId !== null && roomId === null

    const payload = isEdit
      ? ({
          name: values.name.trim(),
          phoneNumber: values.phoneNumber,
          roomId: roomId ?? undefined,
          clearRoom,
          moveInDate: moveInDate ?? undefined,
          moveOutDate: moveOutDate ?? undefined,
          memo,
        } satisfies UpdateTenantPayload)
      : ({
          name: values.name.trim(),
          phoneNumber: values.phoneNumber,
          roomId,
          moveInDate,
          memo,
        } satisfies CreateTenantPayload)

    try {
      await onSubmit(payload)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
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
        if (err.code === 'INVALID_TENANT_FIELD') {
          setError('name', { type: 'server', message: err.message })
          return
        }
      }
      throw err
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="이름" error={errors.name?.message}>
          <input
            {...register('name')}
            placeholder="홍길동"
            autoComplete="off"
            className={inputCls}
          />
        </Field>
        <Field label="연락처" error={errors.phoneNumber?.message}>
          <input
            {...register('phoneNumber')}
            placeholder="010-1234-5678"
            inputMode="tel"
            autoComplete="off"
            className={inputCls}
          />
        </Field>
        <Field label="방" error={errors.roomId?.message}>
          <select {...register('roomId')} className={inputCls}>
            <option value="">— 미배정 —</option>
            {rooms
              .slice()
              .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
              .map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.roomNumber}호 ({r.floor}F)
                </option>
              ))}
          </select>
        </Field>
        <Field label="입실일" error={errors.moveInDate?.message}>
          <input
            type="date"
            {...register('moveInDate')}
            className={inputCls}
          />
        </Field>
        {isEdit ? (
          <Field label="퇴실일" error={errors.moveOutDate?.message}>
            <input
              type="date"
              {...register('moveOutDate')}
              className={inputCls}
            />
          </Field>
        ) : null}
      </div>

      <Field label="메모" error={errors.memo?.message}>
        <textarea
          {...register('memo')}
          rows={3}
          placeholder="특이사항이 있다면…"
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
          disabled={submitting || (isEdit && !isDirty)}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? '저장 중…' : (submitLabel ?? '저장')}
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
