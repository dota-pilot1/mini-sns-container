import { apiFetch } from '@/shared/api/client'

export type TenantResponse = {
  tenantId: string
  userId: string | null
  name: string
  phoneNumber: string
  memo: string | null
  createdAt: string
  updatedAt: string
}

export type CreateTenantPayload = {
  userId?: string | null
  name: string
  phoneNumber: string
  memo?: string | null
}

export type UpdateTenantPayload = {
  name?: string
  phoneNumber?: string
  memo?: string | null
}

export const tenantApi = {
  list(): Promise<TenantResponse[]> {
    return apiFetch<TenantResponse[]>('/api/tenants')
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
  remove(tenantId: string): Promise<void> {
    return apiFetch<void>(`/api/tenants/${tenantId}`, { method: 'DELETE' })
  },
}
