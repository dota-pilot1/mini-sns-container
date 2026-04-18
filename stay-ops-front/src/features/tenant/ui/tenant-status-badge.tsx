import {
  TENANT_STATUS_BADGE,
  TENANT_STATUS_LABEL,
  type TenantStatus,
} from '@/features/tenant/model/tenant-types'

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        TENANT_STATUS_BADGE[status],
      ].join(' ')}
    >
      {TENANT_STATUS_LABEL[status]}
    </span>
  )
}
