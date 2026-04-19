import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import type { ContractResponse } from '@/features/contract/api/contract-api'
import { useContractsQuery } from '@/features/contract/model/use-contracts'
import { CancelOccupancyDialog } from '@/features/contract/ui/cancel-occupancy-dialog'
import { ExtendAndPayDialog } from '@/features/contract/ui/extend-and-pay-dialog'
import { usePaymentsQuery } from '@/features/payment/model/use-payments'
import { PaymentStatusPill } from '@/features/payment/ui/payment-status-pill'
import type { RoomResponse } from '@/features/room/api/room-api'
import { useChangeRoomStatus } from '@/features/room/model/use-change-room-status'
import { useDeleteRoom } from '@/features/room/model/use-delete-room'
import { useUpdateRoom } from '@/features/room/model/use-update-room'
import {
  ROOM_OPTION_LABEL,
  ROOM_STATUS_DOT,
  ROOM_STATUS_LABEL,
  ROOM_STATUS_ORDER,
} from '@/features/room/model/room-types'
import { RoomForm } from '@/features/room/ui/room-form'
import { RoomStatusBadge } from '@/features/room/ui/room-status-badge'
import type { TenantResponse } from '@/features/tenant/api/tenant-api'
import { useTenantsQuery } from '@/features/tenant/model/use-tenants'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill'

const krw = new Intl.NumberFormat('ko-KR')
const dateFmt = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type Props = {
  room: RoomResponse | null
  onClose: () => void
}

type Mode = 'view' | 'edit'

export function RoomDetailDrawer({ room, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = useDeleteRoom()
  const updateMutation = useUpdateRoom()

  // 다른 방으로 전환되면 view 모드로 리셋
  useEffect(() => {
    setMode('view')
  }, [room?.roomId])

  // ESC 로 닫기 — confirm 열려있거나 edit 모드면 drawer 닫히지 않음
  useEffect(() => {
    if (!room || confirmOpen || mode === 'edit') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [room, confirmOpen, mode, onClose])

  if (!room) return null

  const handleDelete = () => {
    deleteMutation.mutate(room.roomId, {
      onSuccess: () => {
        setConfirmOpen(false)
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="닫기"
        onClick={mode === 'edit' ? undefined : onClose}
        disabled={mode === 'edit'}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm disabled:cursor-default"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={`방 ${room.roomNumber} 상세`}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] shadow-[-20px_0_60px_rgba(0,0,0,0.2)]"
      >
        <Header room={room} onClose={onClose} mode={mode} />

        {mode === 'view' ? (
          <>
            <StatusSection room={room} />
            <TenantsSection roomId={room.roomId} roomNumber={room.roomNumber} />
            <InfoSection room={room} />
            <Footer
              onEdit={() => setMode('edit')}
              onDelete={() => setConfirmOpen(true)}
            />
          </>
        ) : (
          <section className="px-5 pb-5">
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
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => (deleteMutation.isPending ? null : setConfirmOpen(false))}
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

/* ───── Header ───── */

function Header({
  room,
  onClose,
  mode,
}: {
  room: RoomResponse
  onClose: () => void
  mode: Mode
}) {
  const navigate = useNavigate()
  return (
    <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            {room.roomNumber}
          </h2>
          <span className="text-sm text-[var(--muted)]">
            {mode === 'edit' ? '수정 중' : '호'}
          </span>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            navigate({
              to: '/rooms/$roomId',
              params: { roomId: room.roomId },
            })
          }
          disabled={mode === 'edit'}
          title="전체 화면으로 보기"
          className="rounded-lg border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-40"
        >
          전체 화면 →
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={mode === 'edit'}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>
    </header>
  )
}

/* ───── Status change ───── */

function StatusSection({ room }: { room: RoomResponse }) {
  const mutation = useChangeRoomStatus()

  return (
    <section className="px-5">
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
              onClick={() =>
                mutation.mutate({ roomId: room.roomId, status: s })
              }
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
      {mutation.isError ? (
        <p className="mt-2 text-xs text-rose-500">
          상태 변경 실패: {mutation.error instanceof Error ? mutation.error.message : '오류'}
        </p>
      ) : null}
    </section>
  )
}

/* ───── Tenants (현재 이 방에 거주/예약된 입주자) ───── */

function TenantsSection({ roomId, roomNumber }: { roomId: string; roomNumber: string }) {
  const navigate = useNavigate()
  const [extendTarget, setExtendTarget] = useState<{
    contract: ContractResponse
    tenant: TenantResponse
  } | null>(null)
  const [cancelTarget, setCancelTarget] = useState<{
    contract: ContractResponse
    tenant: TenantResponse
  } | null>(null)
  const { data: tenants = [], isLoading: tenantsLoading } = useTenantsQuery()
  const { data: contracts = [], isLoading: contractsLoading } = useContractsQuery({
    roomId,
    effectiveOn: todayLocalISO(),
  })

  const linked = useMemo(() => {
    const byId = new Map(tenants.map((t) => [t.tenantId, t]))
    return contracts
      .map((c) => ({ contract: c, tenant: byId.get(c.tenantId) }))
      .filter((x): x is { contract: typeof x.contract; tenant: TenantResponse } => !!x.tenant)
  }, [tenants, contracts])

  const sole = linked.length === 1 ? linked[0] : null

  const goToTenant = (tenantId: string) => {
    navigate({
      to: '/tenants',
      search: { selected: tenantId },
    })
  }

  return (
    <section className="border-t border-[var(--border)] px-5 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          현재 입주자
        </h3>
        {sole ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExtendTarget(sole)}
              className="rounded-md border border-[var(--border)] bg-[var(--control)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
            >
              계약 연장
            </button>
            <button
              type="button"
              onClick={() => setCancelTarget(sole)}
              className="rounded-md border border-rose-500/40 bg-rose-500/5 px-2 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-500/10"
            >
              계약 취소
            </button>
          </div>
        ) : null}
      </div>
      {tenantsLoading || contractsLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-[var(--control)]" />
      ) : linked.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">— 배정된 입주자 없음 —</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {linked.map(({ tenant, contract }) => (
            <ActiveTenantCard
              key={tenant.tenantId}
              tenant={tenant}
              contract={contract}
              onClick={() => goToTenant(tenant.tenantId)}
            />
          ))}
        </ul>
      )}

      <ExtendAndPayDialog
        contract={extendTarget?.contract ?? null}
        tenantName={extendTarget?.tenant.name ?? ''}
        roomNumber={roomNumber}
        onClose={() => setExtendTarget(null)}
      />
      <CancelOccupancyDialog
        contract={cancelTarget?.contract ?? null}
        tenantName={cancelTarget?.tenant.name ?? ''}
        roomNumber={roomNumber}
        onClose={() => setCancelTarget(null)}
      />
    </section>
  )
}

type OccupancyState = 'LIVING' | 'UPCOMING' | 'EXPIRED_ACTIVE'

function deriveOccupancy(contract: ContractResponse, today: string): OccupancyState {
  if (today < contract.startDate) return 'UPCOMING'
  if (today > contract.endDate) return 'EXPIRED_ACTIVE'
  return 'LIVING'
}

const OCCUPANCY_LABEL: Record<OccupancyState, string> = {
  LIVING: '거주중',
  UPCOMING: '입주 예정',
  EXPIRED_ACTIVE: '계약 만료',
}

const OCCUPANCY_TONE: Record<OccupancyState, StatusTone> = {
  LIVING: 'emerald',
  UPCOMING: 'amber',
  EXPIRED_ACTIVE: 'rose',
}

function todayLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function thisMonthString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function daysSince(iso: string): number {
  const start = new Date(iso)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function ActiveTenantCard({
  tenant,
  contract,
  onClick,
}: {
  tenant: TenantResponse
  contract: ContractResponse
  onClick: () => void
}) {
  const today = todayLocalISO()
  const period = thisMonthString()
  const occupancy = deriveOccupancy(contract, today)
  const tenureDays = daysSince(contract.startDate)

  const { data: monthPayments = [] } = usePaymentsQuery({
    contractId: contract.contractId,
    period,
  })
  const paid = monthPayments.find((p) => p.status === 'PAID') ?? null
  const refundedOnly = !paid && monthPayments.some((p) => p.status === 'REFUNDED')
  const paymentStatus = paid ? 'PAID' : refundedOnly ? 'REFUNDED_ONLY' : 'OVERDUE'

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2.5 text-left transition hover:border-[var(--accent)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[-0.01em]">
              {tenant.name}
            </span>
            <span className="tabular-nums text-xs text-[var(--muted)]">
              {tenant.phoneNumber}
            </span>
          </div>
          <span className="flex flex-wrap justify-end gap-1">
            <StatusPill tone={OCCUPANCY_TONE[occupancy]}>
              {OCCUPANCY_LABEL[occupancy]}
            </StatusPill>
            <PaymentStatusPill
              status={paymentStatus}
              title={`${period} ${paymentStatus === 'PAID' ? '완납' : paymentStatus === 'OVERDUE' ? '미납' : '환불됨'}`}
            />
          </span>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2 text-xs">
          <dt className="text-[var(--muted)]">계약</dt>
          <dd className="text-right tabular-nums text-[var(--foreground)]">
            {contract.startDate} ~ {contract.endDate}
          </dd>
          <dt className="text-[var(--muted)]">월세</dt>
          <dd className="text-right tabular-nums text-[var(--foreground)]">
            {krw.format(contract.monthlyRent)}원
          </dd>
          <dt className="text-[var(--muted)]">보증금</dt>
          <dd className="text-right tabular-nums text-[var(--foreground)]">
            {krw.format(contract.deposit)}원
          </dd>
          <dt className="text-[var(--muted)]">
            {occupancy === 'UPCOMING' ? '입주 예정' : '입주'}
          </dt>
          <dd className="text-right tabular-nums text-[var(--foreground)]">
            {occupancy === 'UPCOMING'
              ? `${-tenureDays}일 후`
              : tenureDays === 0
                ? '오늘'
                : `${tenureDays}일째`}
          </dd>
        </dl>
      </button>
    </li>
  )
}

/* ───── Info grid ───── */

function InfoSection({ room }: { room: RoomResponse }) {
  return (
    <section className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-4">
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
      <span className="text-sm font-medium text-[var(--foreground)]">
        {value}
      </span>
    </div>
  )
}

/* ───── Footer ───── */

function Footer({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <footer className="mt-auto flex gap-2 border-t border-[var(--border)] px-5 py-3">
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--control)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--control-hover)]"
      >
        수정
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10"
      >
        삭제
      </button>
    </footer>
  )
}
