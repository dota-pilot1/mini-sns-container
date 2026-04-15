import { useMutation } from '@tanstack/react-query'

import { signupApi, type SignupRequest, type SignupResponse } from '../api/signup-api'

/**
 * 회원가입 뮤테이션 훅.
 * 성공/에러는 호출부에서 ApiError 기준으로 처리.
 */
export function useSignup() {
  return useMutation<SignupResponse, Error, SignupRequest>({
    mutationFn: (body) => signupApi.execute(body),
  })
}
