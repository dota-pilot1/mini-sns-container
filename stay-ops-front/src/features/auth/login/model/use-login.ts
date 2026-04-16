import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/shared/auth/auth-store'

import { loginApi, type LoginRequest, type LoginResponse } from '../api/login-api'

/**
 * 로그인 뮤테이션 훅.
 * 성공 시 자동으로 auth-store 에 토큰 + 유저 저장.
 */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (body) => loginApi.execute(body),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
    },
  })
}
