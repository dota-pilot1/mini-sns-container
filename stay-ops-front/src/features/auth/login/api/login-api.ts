import { apiFetch } from '@/shared/api/client'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  tokenType: string
  accessToken: string
  expiresIn: number
  user: {
    userId: string
    email: string
    name: string
  }
}

export const loginApi = {
  execute(body: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
