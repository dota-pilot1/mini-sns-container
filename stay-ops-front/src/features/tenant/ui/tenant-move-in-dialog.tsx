import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useCreateContract } from '@/features/contract/model/use-create-contract'
import type { RoomResponse } from '@/features/room/api/room-api'
import { ROOM_OPTION_LABEL } from '@/features/room/model/room-types'
import { useCreateTenant } from '@/features/tenant/model/use-create-tenant'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import type { UserResponse } from '@/features/user/api/user-api'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/

const moveInSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, '01X-XXXX-XXXX 형식으로 입력해주세요.'),
  startDate: z.string().min(1, '입실일은 필수입니다.'),
  endDate: z.string().min(1, '계약 종료일은 필수입니다.'),
  monthlyRent: z.number().int().nonnegative('월세는 0 이상이어야 합니다.'),
  deposit: z.number().int().nonnegative('보증금은 0 이상이어야 합니다.'),
  memo: z.string().max(500, '메모는 500자 이하여야 합니다.').optional(),
})

type MoveInValues = z.infer<typeof moveInSchema>

const numberFmt = new Intl.NumberFormat('ko-KR')

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function addMonthString(isoDate: string, months: number): string {
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

type Props = {
  user: UserResponse | null
  rooms: RoomResponse[]
  /** 이미 거주중인 입주자가 점유한 방 id (그리드에서 비활성화). */
  occupiedRoomIds: Set<string>
  onClose: () => void
  onCreated?: (tenantId: string) => void
}

/**
 * 회원(User) → 입주자(Tenant) + 계약(Contract) 생성 다이얼로그.
 */
export function TenantMoveInDialog({
  user,
  rooms,
  occupiedRoomIds,
  onClose,
  onCreated,
}: Props) {
  const createTenant = useCreateTenant()
  const createContract = useCreateContract()
  const { data: existingTenants = [] } = useTenantsQuery()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [topError, setTopError] = useState<string | null>(null)
  const [phoneCheck, setPhoneCheck] = useState<
    { status: 'ok'; phone: string } | { status: 'dup'; phone: string; name: string } | null
  >(null)

  const open = user !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    formState: { errors },
    watch,
  } = useForm<MoveInValues>({
    resolver: zodResolver(moveInSchema),
    mode: 'onTouched',
    defaultValues: {
      phoneNumber: '',
      startDate: todayString(),
      endDate: addMonthString(todayString(), 1),
      monthlyRent: 0,
      deposit: 0,
      memo: '',
    },
  })

  const startDateValue = watch('startDate')

  useEffect(() => {
    if (user) {
      const start = todayString()
      reset({
        phoneNumber: '',
        startDate: start,
        endDate: addMonthString(start, 1),
        monthlyRent: 0,
        deposit: 0,
        memo: '',
      })
      setSelectedRoomId(null)
      setTopError(null)
      setPhoneCheck(null)
    }
  }, [user, reset])

  const phoneInputReg = register('phoneNumber')

  const onCheckPhone = () => {
    const normalized = (getValues('phoneNumber') ?? '').replace(/\D/g, '')
    if (!normalized) return
    const hit = existingTenants.find(
      (t) => t.phoneNumber.replace(/\D/g, '') === normalized,
    )
    if (hit) {
      setPhoneCheck({ status: 'dup', phone: normalized, name: hit.name })
    } else {
      setPhoneCheck({ status: 'ok', phone: normalized })
    }
  }

  // 방 선택 시 월세·보증금 기본값 주입
  useEffect(() => {
    if (!selectedRoomId) return
    const room = rooms.find((r) => r.roomId === selectedRoomId)
    if (!room) return
    setValue('monthlyRent', room.monthlyRent, { shouldDirty: true })
    setValue('deposit', room.deposit, { shouldDirty: true })
  }, [selectedRoomId, rooms, setValue])

  // 시작일 변경 시 종료일 = 시작일 + 1개월 자동 보정
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

  const availableCount = useMemo(
    () => rooms.filter((r) => !occupiedRoomIds.has(r.roomId)).length,
    [rooms, occupiedRoomIds],
  )

  const submit = handleSubmit(async (values) => {
    if (!user) return

    if (!selectedRoomId) {
      setTopError('방을 선택해주세요.')
      return
    }

    setTopError(null)
    setSubmitting(true)
    try {
      const tenant = await createTenant.mutateAsync({
        userId: user.userId,
        name: user.name,
        phoneNumber: values.phoneNumber,
        memo: values.memo?.trim() ? values.memo.trim() : null,
      })

      await createContract.mutateAsync({
        tenantId: tenant.tenantId,
        roomId: selectedRoomId,
        startDate: values.startDate,
        endDate: values.endDate,
        monthlyRent: values.monthlyRent,
        deposit: values.deposit,
      })

      onCreated?.(tenant.tenantId)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        for (const fe of err.fieldErrors) {
          if (
            fe.field === 'phoneNumber' ||
            fe.field === 'memo' ||
            fe.field === 'startDate' ||
            fe.field === 'endDate' ||
            fe.field === 'monthlyRent' ||
            fe.field === 'deposit'
          ) {
            setError(fe.field as keyof MoveInValues, {
              type: 'server',
              message: fe.message,
            })
          }
        }
        setTopError(err.message)
        return
      }
      setTopError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Dialog
      open={open}
      onClose={() => (submitting ? undefined : onClose())}
      ariaLabel="입주 처리"
      maxWidth="max-w-[1400px]"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-[-0.02em]">입주 처리</h2>
          {user ? (
            <p className="text-xs text-[var(--muted)]">
              {user.name} · {user.email}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 gap-0 md:grid-cols-[minmax(0,340px)_1fr] xl:grid-cols-[minmax(0,340px)_1fr_minmax(0,320px)]"
      >
        {/* 왼쪽: 입력 필드 */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-5 md:border-b-0 md:border-r">
          <Field label="연락처" error={errors.phoneNumber?.message}>
            <div className="flex gap-2">
              <input
                {...phoneInputReg}
                onChange={(e) => {
                  phoneInputReg.onChange(e)
                  if (phoneCheck) setPhoneCheck(null)
                }}
                placeholder="010-1234-5678"
                inputMode="tel"
                autoComplete="off"
                className={[inputCls, 'flex-1'].join(' ')}
              />
              <button
                type="button"
                onClick={onCheckPhone}
                className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)]"
              >
                중복 확인
              </button>
            </div>
            {phoneCheck?.status === 'ok' ? (
              <span className="text-xs text-emerald-600">
                ✓ 사용 가능한 번호입니다.
              </span>
            ) : phoneCheck?.status === 'dup' ? (
              <span className="text-xs text-rose-500">
                이미 등록된 입주자입니다: {phoneCheck.name}
              </span>
            ) : null}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="계약 시작" error={errors.startDate?.message}>
              <input type="date" {...register('startDate')} className={inputCls} />
            </Field>
            <Field label="계약 종료" error={errors.endDate?.message}>
              <input type="date" {...register('endDate')} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <Field label="메모" error={errors.memo?.message}>
            <textarea
              {...register('memo')}
              rows={3}
              placeholder="특이사항이 있다면…"
              className={[inputCls, 'resize-none'].join(' ')}
            />
          </Field>

          {/* xl 이하 (3컬럼 미적용) 에서는 좌측 하단에 방 상세 표시 */}
          <div className="mt-auto xl:hidden">
            <SelectedRoomDetail
              room={selectedRoomId ? rooms.find((r) => r.roomId === selectedRoomId) : undefined}
            />
          </div>
        </div>

        {/* 가운데: 방 그리드 */}
        <div className="flex flex-col gap-3 px-6 py-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">방 선택</h3>
            <span className="text-xs text-[var(--muted)]">
              빈 방 {availableCount} / 전체 {rooms.length}
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {roomsByFloor.map(([floor, floorRooms]) => (
              <div key={floor} className="flex flex-col gap-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {floor}F
                </h4>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                  {floorRooms.map((r) => {
                    const occupied = occupiedRoomIds.has(r.roomId)
                    const selected = selectedRoomId === r.roomId
                    return (
                      <RoomTile
                        key={r.roomId}
                        room={r}
                        occupied={occupied}
                        selected={selected}
                        onSelect={() => setSelectedRoomId(r.roomId)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 방 상세 (xl 이상에서만 노출) */}
        <div className="hidden xl:flex flex-col gap-3 border-l border-[var(--border)] px-6 py-5">
          <h3 className="text-sm font-semibold">방 상세</h3>
          <SelectedRoomDetail
            room={selectedRoomId ? rooms.find((r) => r.roomId === selectedRoomId) : undefined}
          />
        </div>

        {/* footer 전체 span */}
        <div className="col-span-full flex flex-col gap-2 border-t border-[var(--border)] px-5 py-3">
          {topError ? (
            <p className="text-xs text-rose-500">입주 처리 실패: {topError}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? '처리 중…' : '입주 확정'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}

/* ───── selected room detail summary ───── */

function SelectedRoomDetail({ room }: { room?: RoomResponse }) {
  if (!room) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--control)] px-3 py-6 text-center text-xs text-[var(--muted)]">
        방을 선택하면 상세 정보가 여기에 표시됩니다
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-3 text-xs">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {room.roomNumber}호
        </span>
        <span className="text-[var(--muted)]">
          {room.floor}F · {Number(room.sizePyeong)}평
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[var(--muted)]">
        <span>월세</span>
        <span className="text-right tabular-nums text-[var(--foreground)]">
          {numberFmt.format(room.monthlyRent)}원
        </span>
        <span>보증금</span>
        <span className="text-right tabular-nums text-[var(--foreground)]">
          {numberFmt.format(room.deposit)}원
        </span>
      </div>
      {room.options.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {room.options.map((opt) => (
            <span
              key={opt}
              className="rounded-md bg-[var(--surface-strong)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]"
            >
              {ROOM_OPTION_LABEL[opt]}
            </span>
          ))}
        </div>
      ) : null}
      {room.memo ? (
        <p className="border-t border-[var(--border)] pt-1.5 text-[11px] text-[var(--muted)]">
          {room.memo}
        </p>
      ) : null}
    </div>
  )
}

/* ───── room picker tile ───── */

function RoomTile({
  room,
  occupied,
  selected,
  onSelect,
}: {
  room: RoomResponse
  occupied: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={occupied}
      onClick={onSelect}
      title={
        occupied
          ? '이미 거주중인 방'
          : `${room.roomNumber}호 · 월세 ${numberFmt.format(room.monthlyRent)}원 / 보증금 ${numberFmt.format(room.deposit)}원`
      }
      className={[
        'relative flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition',
        occupied
          ? 'cursor-not-allowed border-[var(--border)] bg-[var(--control)] text-[var(--muted)] opacity-50'
          : selected
            ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm'
            : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] hover:border-[var(--accent)]',
      ].join(' ')}
    >
      <span className="text-sm font-semibold tabular-nums">{room.roomNumber}</span>
      <span
        className={[
          'text-[10px]',
          selected && !occupied ? 'text-white/80' : 'text-[var(--muted)]',
        ].join(' ')}
      >
        {occupied ? '거주중' : `${numberFmt.format(room.monthlyRent)}`}
      </span>
    </button>
  )
}

/* ───── field helper ───── */

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
