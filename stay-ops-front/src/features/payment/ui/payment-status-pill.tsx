import type { RoomPaymentStatus } from '@/features/payment/model/use-room-payment-status'
import { StatusPill, type StatusTone } from '@/shared/ui/status-pill'

const LABEL: Record<RoomPaymentStatus, string> = {
  PAID: '완납',
  OVERDUE: '미납',
  REFUNDED_ONLY: '환불',
}

const TONE: Record<RoomPaymentStatus, StatusTone> = {
  PAID: 'emerald',
  OVERDUE: 'rose',
  REFUNDED_ONLY: 'amber',
}

type Props = {
  status: RoomPaymentStatus
  /** 보조 텍스트 (예: "2026-04 완납"). */
  title?: string
  /** 라벨 앞에 붙는 기간 표시 (예: "4월"). 주면 "4월 완납" 형태로 노출. */
  periodLabel?: string
}

export function PaymentStatusPill({ status, title, periodLabel }: Props) {
  const baseLabel = LABEL[status]
  const text = periodLabel ? `${periodLabel} ${baseLabel}` : baseLabel
  return (
    <StatusPill tone={TONE[status]} title={title ?? text}>
      {text}
    </StatusPill>
  )
}
