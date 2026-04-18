import { apiFetch } from '@/shared/api/client'

export type UserResponse = {
  userId: string
  email: string
  name: string
  createdAt: string
}

export type ListUsersParams = {
  page?: number
  size?: number
}

export type ListUsersResponse = {
  items: UserResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

function buildQuery(params: ListUsersParams): string {
  const entries: [string, string][] = []
  if (params.page !== undefined) entries.push(['page', String(params.page)])
  if (params.size !== undefined) entries.push(['size', String(params.size)])
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

export const userApi = {
  list(params: ListUsersParams = {}): Promise<ListUsersResponse> {
    return apiFetch<ListUsersResponse>(`/api/users${buildQuery(params)}`)
  },
}
