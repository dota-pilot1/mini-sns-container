/**
 * 백엔드 에러 응답 공통 포맷
 * (ErrorResponse.java 와 1:1 매핑)
 */
export type ApiErrorBody = {
  code: string
  message: string
  errors?: Array<{ field: string; message: string }>
  timestamp?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Array<{ field: string; message: string }>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.fieldErrors = body.errors ?? []
  }
}
