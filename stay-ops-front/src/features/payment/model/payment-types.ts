export const PAYMENT_STATUSES = ['PAID', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: '완납',
  REFUNDED: '환불',
}

export const PAYMENT_METHODS = ['CARD', 'CASH', 'BANK_TRANSFER'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CARD: '신용카드',
  CASH: '현금',
  BANK_TRANSFER: '계좌이체',
}
