import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { RoomResponse } from '@/features/room/api/room-api'
import type { CreateTenantPayload } from '@/features/tenant/api/tenant-api'
import { useCreateTenant } from '@/features/tenant/model/use-create-tenant'
import type { UserResponse } from '@/features/user/api/user-api'
import { ApiError } from '@/shared/api/types'
import { Dialog } from '@/shared/ui/dialog'

const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/

const moveInSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, '01X-XXXX-XXXX 형식으로 입력해주세요.'),
  moveInDate: z.string().optional(),
  memo: z.string().max(500, '메모는 500자 이하여야 합니다.').optional(),
})

type MoveInValues = z.infer<typeof moveInSchema>

type Props = {
  user: UserResponse | null
  rooms: RoomResponse[]
  /** 이미 거주중인 입주자가 점유한 방 id (그리드에서 비활성화). */
  occupiedRoomIds: Set<string>
  onClose: () => void
  onCreated?: (tenantId: string) => void
}

/**
 * 회원(User) → 입주자(Tenant) 전환 다이얼로그.
 * 좌: 입주 정보 입력, 우: 층별 방 그리드 (점유중이면 비활성).
 */
export function TenantMoveInDialog({
  user,
  rooms,
  occupiedRoomIds,
  onClose,
  onCreated,
}: Props) {
  const createMutation = useCreateTenant()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  const open = user !== null

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MoveInValues>({
    resolver: zodResolver(moveInSchema),
    mode: 'onTouched',
    defaultValues: {
      phoneNumber: '',
      moveInDate: new Date().toISOString().slice(0, 10),
      memo: '',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        phoneNumber: '',
        moveInDate: new Date().toISOString().slice(0, 10),
        memo: '',
      })
      setSelectedRoomId(null)
    }
  }, [user, reset])

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

    const payload: CreateTenantPayload = {
      name: user.name,
      phoneNumber: values.phoneNumber,
      roomId: selectedRoomId,
      moveInDate: values.moveInDate?.trim() || null,
      memo: values.memo?.trim() ? values.memo.trim() : null,
    }

    try {
      const created = await createMutation.mutateAsync(payload)
      onCreated?.(created.tenantId)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        for (const fe of err.fieldErrors) {
          if (fe.field === 'phoneNumber' || fe.field === 'memo' || fe.field === 'moveInDate') {
            setError(fe.field as keyof MoveInValues, {
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
    <Dialog
      open={open}
      onClose={() => (createMutation.isPending ? undefined : onClose())}
      ariaLabel="입주 처리"
      maxWidth="max-w-4xl"
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
          disabled={createMutation.isPending}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 gap-0 md:grid-cols-[minmax(0,320px)_1fr]">
        {/* 왼쪽: 입력 필드 */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-4 md:border-b-0 md:border-r">
          <Field label="연락처" error={errors.phoneNumber?.message}>
            <input
              {...register('phoneNumber')}
              placeholder="010-1234-5678"
              inputMode="tel"
              autoComplete="off"
              className={inputCls}
            />
          </Field>

          <Field label="입실일" error={errors.moveInDate?.message}>
            <input type="date" {...register('moveInDate')} className={inputCls} />
          </Field>

          <Field label="메모" error={errors.memo?.message}>
            <textarea
              {...register('memo')}
              rows={5}
              placeholder="특이사항이 있다면…"
              className={[inputCls, 'resize-none'].join(' ')}
            />
          </Field>

          <div className="mt-auto rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-xs">
            <span className="font-medium text-[var(--foreground)]">배정된 방 </span>
            <span className="text-[var(--muted)]">
              {selectedRoomId
                ? `${rooms.find((r) => r.roomId === selectedRoomId)?.roomNumber ?? ''}호`
                : '미배정'}
            </span>
          </div>
        </div>

        {/* 오른쪽: 방 그리드 */}
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">방 선택</h3>
            <span className="text-xs text-[var(--muted)]">
              빈 방 {availableCount} / 전체 {rooms.length}
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
            {/* 미배정 카드 */}
            <UnassignedTile
              selected={selectedRoomId === null}
              onSelect={() => setSelectedRoomId(null)}
            />

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

        {/* footer 전체 span */}
        <div className="col-span-full flex flex-col gap-2 border-t border-[var(--border)] px-5 py-3">
          {createMutation.isError ? (
            <p className="text-xs text-rose-500">
              입주 처리 실패:{' '}
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : '알 수 없는 오류'}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--control-hover)] disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {createMutation.isPending ? '처리 중…' : '입주 확정'}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}

/* ───── room picker tiles ───── */

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
      title={occupied ? '이미 거주중인 방' : `${room.roomNumber}호 (${room.sizePyeong}평)`}
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
        {occupied ? '거주중' : `${room.sizePyeong}평`}
      </span>
    </button>
  )
}

function UnassignedTile({
  selected,
  onSelect,
}: {
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-left transition',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--muted)] hover:border-[var(--accent)]',
      ].join(' ')}
    >
      <span className="text-sm font-medium">미배정으로 입주</span>
      <span className="text-xs text-[var(--muted)]">방 나중에 지정</span>
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
