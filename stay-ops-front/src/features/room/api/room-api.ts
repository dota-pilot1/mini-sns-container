import { apiFetch } from '@/shared/api/client'

import type {
  RoomOption,
  RoomStatus,
} from '@/features/room/model/room-types'

export type RoomResponse = {
  roomId: string
  roomNumber: string
  floor: number
  sizePyeong: number
  monthlyRent: number
  deposit: number
  status: RoomStatus
  options: RoomOption[]
  memo: string | null
  /** 목록 응답에선 대표 이미지 presigned URL. 상세/생성/수정 응답에선 null. */
  primaryImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreateRoomPayload = {
  roomNumber: string
  floor: number
  sizePyeong: number
  monthlyRent: number
  deposit: number
  options?: RoomOption[]
  memo?: string | null
}

export type UpdateRoomPayload = Partial<CreateRoomPayload>

export type ListRoomsParams = {
  floor?: number
  status?: RoomStatus
}

function buildQuery(params: ListRoomsParams): string {
  const entries: [string, string][] = []
  if (params.floor !== undefined) entries.push(['floor', String(params.floor)])
  if (params.status) entries.push(['status', params.status])
  if (entries.length === 0) return ''
  const qs = new URLSearchParams(entries).toString()
  return `?${qs}`
}

export const roomApi = {
  list(params: ListRoomsParams = {}): Promise<RoomResponse[]> {
    return apiFetch<RoomResponse[]>(`/api/rooms${buildQuery(params)}`)
  },
  get(roomId: string): Promise<RoomResponse> {
    return apiFetch<RoomResponse>(`/api/rooms/${roomId}`)
  },
  create(body: CreateRoomPayload): Promise<RoomResponse> {
    return apiFetch<RoomResponse>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  update(roomId: string, body: UpdateRoomPayload): Promise<RoomResponse> {
    return apiFetch<RoomResponse>(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  changeStatus(roomId: string, status: RoomStatus): Promise<RoomResponse> {
    return apiFetch<RoomResponse>(`/api/rooms/${roomId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  remove(roomId: string): Promise<void> {
    return apiFetch<void>(`/api/rooms/${roomId}`, { method: 'DELETE' })
  },
}
