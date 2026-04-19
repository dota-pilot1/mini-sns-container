import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useCreateContract } from '@/features/contract/model/use-create-contract'
import type { RoomResponse } from '@/features/room/api/room-api'
import { useRoomsQuery } from '@/features/room/model/use-rooms'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

const numberFmt = new Intl.NumberFormat('ko-KR')

const schema = z.object({
  startDate: z.string().min(1, '시작일은 필수입니다.'),
  endDate: z.string().min(1, '종료일은 필수입니다.'),
  monthlyRent: z.number().int().nonnegative('월세는 0 이상이어야 합니다.'),
  deposit: z.number().int().nonnegative('보증금은 0 이상이어야 합니다.'),
})

type Values = z.infer<typeof schema>

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function addMonthString(isoDate: string, months: number): string {
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

type Props = {
  /** null 이면 닫힘. 입주자 ID 가 들어오면 열림. */
  tenantId: string | null
  tenantName: string
  /** 이미 ACTIVE 계약이 있는 방 id 집합 (그리드에서 비활성화). */
  occupiedRoomIds: Set<string>
  onClose: () => void
  onCreated?: () => void
}

/**
 * 입주자 드로어에서 새 계약을 추가하는 다이얼로그. 방 선택 + 기간/금액.
 * (입주자 자체는 이미 존재하므로 TenantMoveInDialog 대신 가벼운 버전.)
 */
export function AddContractDialog({
  tenantId,
  tenantName,
  occupiedRoomIds,
  onClose,
  onCreated,
}: Props) {
  const open = tenantId !== null
  const createContract = useCreateContract()
  const { data: rooms = [] } = useRoomsQuery()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [topError, setTopError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      startDate: todayString(),
      endDate: addMonthString(todayString(), 1),
      monthlyRent: 0,
      deposit: 0,
    },
  })

  const startDateValue = watch('startDate')

  useEffect(() => {
    if (open) {
      const start = todayString()
      reset({
        startDate: start,
        endDate: addMonthString(start, 1),
        monthlyRent: 0,
        deposit: 0,
      })
      setSelectedRoomId(null)
      setTopError(null)
    }
  }, [open, reset])

  useEffect(() => {
    if (!selectedRoomId) return
    const room = rooms.find((r) => r.roomId === selectedRoomId)
    if (!room) return
    setValue('monthlyRent', room.monthlyRent, { shouldDirty: true })
    setValue('deposit', room.deposit, { shouldDirty: true })
  }, [selectedRoomId, rooms, setValue])

  useEffect(() => {
    if (!startDateValue) return
    setValue('endDate', addMonthString(startDateValue, 1), { shouldDirty: true })
  }, [startDateValue, setValue])

  const roomsByFloor = useMemo(() => {
    const grouped = new Map<number, RoomResponse[]>()
    for (const r of rooms) {
      if (!grouped.has(r.floor)) grouped.set(r.floor, [])
      grouped.get(r.floor)!.push(r)
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => b - a)
  }, [rooms])

  const submit = handleSubmit(async (values) => {
    if (!tenantId) return
    if (!selectedRoomId) {
      setTopError('방을 선택해주세요.')
      return
    }
    setTopError(null)
    try {
      await createContract.mutateAsync({
        tenantId,
        roomId: selectedRoomId,
        startDate: values.startDate,
        endDate: values.endDate,
        monthlyRent: values.monthlyRent,
        deposit: values.deposit,
      })
      onCreated?.()
      onClose()
    } catch (err) {
      setTopError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '계약 생성에 실패했습니다.',
      )
    }
  })

  return (
    <Dialog
      open={open}
      onClose={() => (createContract.isPending ? undefined : onClose())}
      ariaLabel="계약 추가"
      maxWidth="max-w-3xl"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">계약 추가</h2>
          <p className="text-xs text-[var(--muted)]">{tenantName} · 방 선택 + 기간/금액</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={createContract.isPending}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-[var(--muted)]">방 선택</h3>
          <div className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto pr-1">
            {roomsByFloor.map(([floor, list]) => (
              <div key={floor} className="flex flex-col gap-1.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {floor}F
                </h4>
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
                  {list.map((r) => {
                    const occupied = occupiedRoomIds.has(r.roomId)
                    const selected = selectedRoomId === r.roomId
                    return (
                      <button
                        key={r.roomId}
                        type="button"
                        disabled={occupied}
                        onClick={() => setSelectedRoomId(r.roomId)}
                        title={
                          occupied
                            ? '이미 거주중인 방'
                            : `${r.roomNumber}호 · 월 ${numberFmt.format(r.monthlyRent)}원`
                        }
                        className={[
                          'flex flex-col items-start gap-0.5 rounded-md border px-1.5 py-1 text-left transition',
                          occupied
                            ? 'cursor-not-allowed border-[var(--border)] bg-[var(--control)] text-[var(--muted)] opacity-50'
                            : selected
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
                              : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] hover:border-[var(--accent)]',
                        ].join(' ')}
                      >
                        <span className="text-xs font-semibold tabular-nums">{r.roomNumber}</span>
                        <span
                          className={[
                            'text-[9px]',
                            selected && !occupied ? 'text-white/80' : 'text-[var(--muted)]',
                          ].join(' ')}
                        >
                          {occupied ? '거주중' : numberFmt.format(r.monthlyRent)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
          <Field label="계약 시작" error={errors.startDate?.message}>
            <input type="date" {...register('startDate')} className={inputCls} />
          </Field>
          <Field label="계약 종료" error={errors.endDate?.message}>
            <input type="date" {...register('endDate')} className={inputCls} />
          </Field>
          <Field label="월세 (원)" error={errors.monthlyRent?.message}>
            <input
              type="number"
              inputMode="numeric"
              {...register('monthlyRent', { valueAsNumber: true })}
              className={inputCls}
            />
          </Field>
          <Field label="보증금 (원)" error={errors.deposit?.message}>
            <input
              type="number"
              inputMode="numeric"
              {...register('deposit', { valueAsNumber: true })}
              className={inputCls}
            />
          </Field>
        </div>

        {topError ? <p className="text-xs text-rose-500">{topError}</p> : null}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createContract.isPending}
            className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createContract.isPending}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {createContract.isPending ? '생성 중…' : '계약 생성'}
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
