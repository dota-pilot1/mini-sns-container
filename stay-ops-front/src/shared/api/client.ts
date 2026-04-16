import { useAuthStore } from '@/shared/auth/auth-store'

import { ApiError, type ApiErrorBody } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/**
 * 공통 fetch 래퍼.
 * - 모든 요청은 `VITE_API_BASE_URL` (기본: http://localhost:8080) 로 직행
 * - 로그인 상태면 Authorization 헤더 자동 첨부
 * - 401 응답 시 auth-store clear (토큰 만료/무효 대응)
 * - 실패 응답은 ApiError 로 throw → feature 레이어에서 일괄 처리
 * - CORS는 백엔드 SecurityConfig에서 허용
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  // 토큰 자동 첨부 (훅 밖이라 getState() 사용)
  const token = useAuthStore.getState().accessToken
  const authHeaders: Record<string, string> = {}
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders,
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const body = text ? (JSON.parse(text) as unknown) : null

  // 401 → 토큰 만료/무효. 스토어 초기화 → 다음 라우트 전환 시 가드가 /login 으로 보냄
  if (response.status === 401) {
    useAuthStore.getState().clear()
  }

  if (!response.ok) {
    throw new ApiError(response.status, (body ?? {
      code: 'UNKNOWN_ERROR',
      message: response.statusText,
    }) as ApiErrorBody)
  }

  return body as T
}
