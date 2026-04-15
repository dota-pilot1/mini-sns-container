import { apiFetch } from '@/shared/api/client'

export type SignupRequest = {
  email: string
  password: string
  name: string
}

export type SignupResponse = {
  userId: string
  email: string
  name: string
  createdAt: string
}

export const signupApi = {
  execute(body: SignupRequest): Promise<SignupResponse> {
    return apiFetch<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
