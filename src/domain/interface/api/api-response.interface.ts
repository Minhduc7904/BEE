// src/application/interfaces/api/api-response.interface.ts

/**
 * Generic interface cho response từ API external
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

/**
 * Interface cho pagination response từ API
 */
export interface ApiPaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Interface cho API error response
 */
export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
  code?: number
  details?: any
}
