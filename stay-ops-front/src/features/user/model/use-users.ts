import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { userApi, type ListUsersParams } from '@/features/user/api/user-api'

export const usersQueryKey = (params: ListUsersParams) =>
  ['users', params] as const

/**
 * 유저 목록 조회.
 * `keepPreviousData` 로 페이지 전환 시 이전 데이터 유지해 레이아웃 점프 방지.
 */
export function useUsersQuery(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: usersQueryKey(params),
    queryFn: () => userApi.list(params),
    placeholderData: keepPreviousData,
  })
}
