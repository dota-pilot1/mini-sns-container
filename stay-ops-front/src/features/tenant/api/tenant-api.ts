import { apiFetch } from '@/shared/api/client'

import type { TenantStatus } from '@/features/tenant/model/tenant-types'

export type TenantResponse = {
  tenantId: string
  name: string
  phoneNumber: string // 표시용 01X-XXXX-XXXX
  roomId: string | null
  status: TenantStatus
  moveInDate: string | null // ISO date
  moveOutDate: string | null
  memo: string | null
  createdAt: string
  updatedAt: string
}

export type CreateTenantPayload = {
  name: string
  phoneNumber: string
  roomId?: string | null
  moveInDate?: string | null
  memo?: string | null
}

export type UpdateTenantPayload = {
  name?: string
  phoneNumber?: string
  roomId?: string | null
  /** true 면 방 연결 해제 (roomId 를 null 로). false/미설정 이면 roomId 값 반영 규칙 적용. */
  clearRoom?: boolean
  moveInDate?: string | null
  moveOutDate?: string | null
  memo?: string | null
}

export type ListTenantsParams = {
  status?: TenantStatus
  roomId?: string
  /** true 면 퇴실(soft-deleted) 목록만 조회 */
  deletedOnly?: boolean
}

function buildQuery(params: ListTenantsParams): string {
  const entries: [string, string][] = []
  if (params.status) entries.push(['status', params.status])
  if (params.roomId) entries.push(['roomId', params.roomId])
  if (params.deletedOnly) entries.push(['deletedOnly', 'true'])
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

export const tenantApi = {
  list(params: ListTenantsParams = {}): Promise<TenantResponse[]> {
    return apiFetch<TenantResponse[]>(`/api/tenants${buildQuery(params)}`)
  },
  get(tenantId: string): Promise<TenantResponse> {
    return apiFetch<TenantResponse>(`/api/tenants/${tenantId}`)
  },
  create(body: CreateTenantPayload): Promise<TenantResponse> {
    return apiFetch<TenantResponse>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  update(tenantId: string, body: UpdateTenantPayload): Promise<TenantResponse> {
    return apiFetch<TenantResponse>(`/api/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  changeStatus(tenantId: string, status: TenantStatus): Promise<TenantResponse> {
    return apiFetch<TenantResponse>(`/api/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  remove(tenantId: string): Promise<void> {
    return apiFetch<void>(`/api/tenants/${tenantId}`, { method: 'DELETE' })
  },
  restore(tenantId: string): Promise<TenantResponse> {
    return apiFetch<TenantResponse>(`/api/tenants/${tenantId}/restore`, {
      method: 'POST',
    })
  },
  hardRemove(tenantId: string): Promise<void> {
    return apiFetch<void>(`/api/tenants/${tenantId}/permanent`, {
      method: 'DELETE',
    })
  },
}
