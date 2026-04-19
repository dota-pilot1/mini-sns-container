import { useNavigate, useParams } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { useContractsQuery } from '@/features/contract/model/use-contracts'

function roomDetailTodayISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}
import { RecentPaymentsSection } from '@/features/payment/ui/recent-payments-section'
import type { RoomResponse } from '@/features/room/api/room-api'
import {
  ROOM_OPTION_LABEL,
  ROOM_STATUS_DOT,
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
} from '@/features/room/model/room-types'
import { useChangeRoomStatus } from '@/features/room/model/use-change-room-status'
import { useDeleteRoom } from '@/features/room/model/use-delete-room'
import { useRoomQuery } from '@/features/room/model/use-room'
import { useUpdateRoom } from '@/features/room/model/use-update-room'
import { RoomForm } from '@/features/room/ui/room-form'
import { RoomImageGallery } from '@/features/room/ui/room-image-gallery'
import { RoomStatusBadge } from '@/features/room/ui/room-status-badge'
import type { TenantResponse } from '@/features/tenant/api/tenant-api'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import { ConfirmDialog } from '@/shared/ui/dialog'

const krw = new Intl.NumberFormat('ko-KR')
const dateFmt = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateOnlyFmt = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type Mode = 'view' | 'edit'

export function RoomDetailPage() {
  const { roomId } = useParams({ from: '/rooms/$roomId' }) as { roomId: string }
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('view')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: room, isLoading, isError, error } = useRoomQuery(roomId)
  const updateMutation = useUpdateRoom()
  const deleteMutation = useDeleteRoom()

  const goToList = () => navigate({ to: '/rooms' })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <HeaderBar title="방 상세" onBack={goToList} />
        <div className="h-48 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]" />
      </div>
    )
  }

  if (isError || !room) {
    return (
      <div className="flex flex-col gap-4">
        <HeaderBar title="방 상세" onBack={goToList} />
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 px-4 py-6 text-sm text-rose-600">
          방 정보를 불러오지 못했어요:{' '}
          {error instanceof Error ? error.message : '방이 존재하지 않습니다.'}
        </div>
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(room.roomId, {
      onSuccess: () => {
        setConfirmOpen(false)
        goToList()
      },
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <HeaderBar
        title={`${room.roomNumber}호`}
        subtitle={`${room.floor}F · ${Number(room.sizePyeong)}평`}
        statusBadge={<RoomStatusBadge status={room.status} />}
        onBack={goToList}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
        {/* Left — 이미지 갤러리 */}
        <div className="order-2 lg:order-1">
          <RoomImageGallery roomId={room.roomId} />
        </div>

        {/* Right — 정보/액션 */}
        <div className="order-1 flex flex-col gap-5 lg:order-2">
          {mode === 'view' ? (
            <>
              <StatusSection room={room} />
              <TenantsSection roomId={room.roomId} />
              <InfoSection room={room} />
              <div className="flex gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10"
                >
                  삭제
                </button>
              </div>
            </>
          ) : (
            <section>
              <h2 className="mb-3 text-sm font-semibold">방 정보 수정</h2>
              <RoomForm
                initial={room}
                submitting={updateMutation.isPending}
                submitLabel="저장"
                onCancel={() => setMode('view')}
                onSubmit={async (payload) => {
                  await updateMutation.mutateAsync(
                    { roomId: room.roomId, body: payload },
                    { onSuccess: () => setMode('view') },
                  )
                }}
              />
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (deleteMutation.isPending ? undefined : setConfirmOpen(false))}
        onConfirm={handleDelete}
        title={`${room.roomNumber}호를 삭제할까요?`}
        description="삭제 후 목록에서 즉시 사라집니다. 서버에는 soft delete 로 기록되어 복구 가능합니다."
        confirmLabel="삭제"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

/* ───── Sub ───── */

function HeaderBar({
  title,
  subtitle,
  statusBadge,
  onBack,
}: {
  title: string
  subtitle?: string
  statusBadge?: React.ReactNode
  onBack: () => void
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
      >
        ← 목록
      </button>
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold tracking-[-0.03em]">{title}</h1>
        {subtitle ? <span className="text-sm text-[var(--muted)]">{subtitle}</span> : null}
      </div>
      {statusBadge}
    </header>
  )
}

function StatusSection({ room }: { room: RoomResponse }) {
  const mutation = useChangeRoomStatus()
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        상태 변경
      </h3>
      <div className="flex flex-wrap gap-2">
        {ROOM_STATUS_ORDER.map((s) => {
          const active = room.status === s
          return (
            <button
              key={s}
              type="button"
              disabled={active || mutation.isPending}
              onClick={() => mutation.mutate({ roomId: room.roomId, status: s })}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'cursor-default border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--control)] text-[var(--foreground)] hover:border-[var(--accent)] disabled:opacity-60',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-1.5 w-1.5 rounded-full',
                  active ? 'bg-white' : ROOM_STATUS_DOT[s],
                ].join(' ')}
              />
              {ROOM_STATUS_LABEL[s]}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TenantsSection({ roomId }: { roomId: string }) {
  const navigate = useNavigate()
  const { data: tenants = [], isLoading: tenantsLoading } = useTenantsQuery()
  const { data: contracts = [], isLoading: contractsLoading } = useContractsQuery({
    roomId,
  })

  const linked = useMemo(() => {
    const byId = new Map(tenants.map((t) => [t.tenantId, t]))
    const today = roomDetailTodayISO()
    const byTenant = new Map<string, typeof contracts>()
    for (const c of contracts) {
      const arr = byTenant.get(c.tenantId) ?? []
      arr.push(c)
      byTenant.set(c.tenantId, arr)
    }
    const items: {
      tenant: TenantResponse
      contract: (typeof contracts)[number]
    }[] = []
    for (const [tenantId, arr] of byTenant) {
      const current = arr.find((c) => today >= c.startDate && today <= c.endDate)
      if (!current) continue
      const tenant = byId.get(tenantId)
      if (!tenant) continue
      items.push({ tenant, contract: current })
    }
    return items
  }, [tenants, contracts])

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        현재 입주자
      </h3>
      {tenantsLoading || contractsLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-[var(--control)]" />
      ) : linked.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">— 배정된 입주자 없음 —</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {linked.map(({ contract, tenant }) => (
            <li key={tenant.tenantId}>
              <button
                type="button"
                onClick={() =>
                  navigate({ to: '/tenants', search: { selected: tenant.tenantId } })
                }
                className="flex w-full flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-left transition hover:border-[var(--accent)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-[-0.01em]">
                      {tenant.name}
                    </span>
                    <span className="tabular-nums text-xs text-[var(--muted)]">
                      {tenant.phoneNumber}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    거주중
                  </span>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2 text-xs">
                  <dt className="text-[var(--muted)]">계약 기간</dt>
                  <dd className="text-right tabular-nums text-[var(--foreground)]">
                    {dateOnlyFmt.format(new Date(contract.startDate))}
                    {' ~ '}
                    {dateOnlyFmt.format(new Date(contract.endDate))}
                  </dd>
                  <dt className="text-[var(--muted)]">월세</dt>
                  <dd className="text-right tabular-nums text-[var(--foreground)]">
                    {krw.format(contract.monthlyRent)}원
                  </dd>
                  <dt className="text-[var(--muted)]">보증금</dt>
                  <dd className="text-right tabular-nums text-[var(--foreground)]">
                    {krw.format(contract.deposit)}원
                  </dd>
                </dl>
              </button>
              <div
                className="mt-2"
                onClick={(e) => e.stopPropagation()}
                role="presentation"
              >
                <RecentPaymentsSection contractId={contract.contractId} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function InfoSection({ room }: { room: RoomResponse }) {
  return (
    <section className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
      <InfoRow label="층" value={`${room.floor}F`} />
      <InfoRow label="평수" value={`${Number(room.sizePyeong)}평`} />
      <InfoRow label="월세" value={`${krw.format(room.monthlyRent)}원`} />
      <InfoRow label="보증금" value={`${krw.format(room.deposit)}원`} />

      <div className="flex items-start justify-between gap-3 py-1.5">
        <span className="shrink-0 text-sm text-[var(--muted)]">옵션</span>
        {room.options.length === 0 ? (
          <span className="text-sm text-[var(--muted)]">—</span>
        ) : (
          <div className="flex flex-wrap justify-end gap-1">
            {room.options.map((o) => (
              <span
                key={o}
                className="inline-flex items-center rounded bg-[var(--control)] px-2 py-0.5 text-xs text-[var(--foreground)]"
              >
                {ROOM_OPTION_LABEL[o]}
              </span>
            ))}
          </div>
        )}
      </div>

      <InfoRow label="메모" value={room.memo ?? '—'} />

      <div className="mt-2 flex flex-col gap-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
        <div className="flex justify-between">
          <span>생성</span>
          <span>{dateFmt.format(new Date(room.createdAt))}</span>
        </div>
        <div className="flex justify-between">
          <span>업데이트</span>
          <span>{dateFmt.format(new Date(room.updatedAt))}</span>
        </div>
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
    </div>
  )
}
