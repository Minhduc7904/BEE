// src/application/interfaces/api/api-request.interface.ts

/**
 * Interface cho các options khi gọi API
 */
export interface ApiRequestOptions {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
  headers?: Record<string, string>
}

/**
 * Interface cho query parameters
 */
export interface ApiQueryParams {
  limit?: number
  offset?: number
  page?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  [key: string]: any
}
