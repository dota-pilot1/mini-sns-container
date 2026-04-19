import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import type {
  CreateRoomPayload,
  RoomResponse,
} from '@/features/room/api/room-api'
import {
  ROOM_OPTIONS,
  ROOM_OPTION_LABEL,
  type RoomOption,
} from '@/features/room/model/room-types'
import { ApiError } from '@/shared/api/types'

/* ───── schema ───── */

const roomFormSchema = z.object({
  roomNumber: z
    .string()
    .trim()
    .min(1, '호수는 필수입니다.')
    .max(10, '호수는 최대 10자입니다.')
    .regex(/^[A-Za-z0-9-]+$/, '영문/숫자/하이픈만 가능합니다.'),
  floor: z.coerce
    .number({ message: '층은 숫자여야 합니다.' })
    .int('층은 정수여야 합니다.')
    .min(-5, '층은 -5 이상이어야 합니다.')
    .max(50, '층은 50 이하여야 합니다.'),
  sizePyeong: z.coerce
    .number({ message: '평수는 숫자여야 합니다.' })
    .positive('평수는 0보다 커야 합니다.'),
  monthlyRent: z.coerce
    .number({ message: '월세는 숫자여야 합니다.' })
    .int('월세는 정수여야 합니다.')
    .min(0, '월세는 0 이상이어야 합니다.'),
  deposit: z.coerce
    .number({ message: '보증금은 숫자여야 합니다.' })
    .int('보증금은 정수여야 합니다.')
    .min(0, '보증금은 0 이상이어야 합니다.'),
  options: z.array(z.enum(ROOM_OPTIONS)),
  memo: z.string().max(500, '메모는 500자 이하여야 합니다.').optional(),
})

export type RoomFormValues = z.infer<typeof roomFormSchema>

/* ───── component ───── */

type Props = {
  /** edit 모드면 초기값 전달. undefined 면 create 모드. */
  initial?: RoomResponse
  onSubmit: (values: CreateRoomPayload) => Promise<unknown>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

export function RoomForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
}: Props) {
  const defaultValues: RoomFormValues = initial
    ? {
        roomNumber: initial.roomNumber,
        floor: initial.floor,
        sizePyeong: initial.sizePyeong,
        monthlyRent: initial.monthlyRent,
        deposit: initial.deposit,
        options: [...initial.options],
        memo: initial.memo ?? '',
      }
    : {
        roomNumber: '',
        floor: 6,
        sizePyeong: 2.8,
        monthlyRent: 380000,
        deposit: 1000000,
        options: ['AIRCON', 'WINDOW'],
        memo: '',
      }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    mode: 'onTouched',
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.roomId])

  const submit = handleSubmit(async (values) => {
    const payload: CreateRoomPayload = {
      roomNumber: values.roomNumber.trim().toUpperCase(),
      floor: values.floor,
      sizePyeong: values.sizePyeong,
      monthlyRent: values.monthlyRent,
      deposit: values.deposit,
      options: values.options,
      memo: values.memo?.trim() ? values.memo.trim() : null,
    }
    try {
      await onSubmit(payload)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
          for (const fe of err.fieldErrors) {
            if (fe.field in values) {
              setError(fe.field as keyof RoomFormValues, {
                type: 'server',
                message: fe.message,
              })
            }
          }
          return
        }
        if (err.code === 'DUPLICATE_ROOM_NUMBER') {
          setError('roomNumber', { type: 'server', message: err.message })
          return
        }
        if (err.code === 'INVALID_ROOM_FIELD') {
          setError('roomNumber', { type: 'server', message: err.message })
          return
        }
      }
      throw err
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="호수" error={errors.roomNumber?.message}>
          <input
            {...register('roomNumber')}
            placeholder="701"
            className={inputCls}
          />
        </Field>
        <Field label="층" error={errors.floor?.message}>
          <input
            type="number"
            {...register('floor')}
            className={inputCls}
          />
        </Field>
        <Field label="평수" error={errors.sizePyeong?.message}>
          <input
            type="number"
            step="0.1"
            {...register('sizePyeong')}
            className={inputCls}
          />
        </Field>
        <Field label="월세 (원)" error={errors.monthlyRent?.message}>
          <input
            type="number"
            step="10000"
            {...register('monthlyRent')}
            className={inputCls}
          />
        </Field>
        <Field label="보증금 (원)" error={errors.deposit?.message}>
          <input
            type="number"
            step="100000"
            {...register('deposit')}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="옵션" error={errors.options?.message}>
        <Controller
          name="options"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {ROOM_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const next: RoomOption[] = checked
                        ? field.value.filter((o: RoomOption) => o !== opt)
                        : [...field.value, opt]
                      field.onChange(next)
                    }}
                    className={[
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      checked
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border)] bg-[var(--control)] text-[var(--foreground)] hover:border-[var(--accent)]',
                    ].join(' ')}
                  >
                    {ROOM_OPTION_LABEL[opt]}
                  </button>
                )
              })}
            </div>
          )}
        />
      </Field>

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
          disabled={submitting || (initial !== undefined && !isDirty)}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? '저장 중…' : (submitLabel ?? '저장')}
        </button>
      </div>
    </form>
  )
}

/* ───── primitives ───── */

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
      {error ? (
        <span className="text-xs text-rose-500">{error}</span>
      ) : null}
    </label>
  )
}
