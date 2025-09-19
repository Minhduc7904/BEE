import { Injectable, Logger, Inject } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import axios from 'axios'
import httpClientConfig from '../../config/http-client.config'

export interface HttpClientOptions {
  timeout?: number
  headers?: Record<string, string>
  baseURL?: string
  retries?: number
  retryDelay?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status?: number
  headers?: any
}

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name)
  private readonly axiosInstance: any

  constructor(
    @Inject(httpClientConfig.KEY)
    private readonly config: ConfigType<typeof httpClientConfig>,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BEE-Service/2.0',
        ...(this.config.bearerToken && {
          Authorization: `Bearer ${this.config.bearerToken}`,
        }),
      },
    })

    this.logger.log(`HTTP Client initialized with baseURL: ${this.config.baseURL}`)
    if (this.config.bearerToken) {
      this.logger.log('Bearer token configured for authentication')
    }

    // Response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        this.logger.debug(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
        return response
      },
      (error: any) => {
        const { config, response } = error
        this.logger.error(
          `❌ ${config?.method?.toUpperCase()} ${config?.url} - ${response?.status || 'NETWORK_ERROR'}`,
          error.message,
        )
        return Promise.reject(error)
      },
    )
  }

  /**
   * Update Bearer token for authentication
   */
  updateBearerToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    this.logger.log('Bearer token updated')
  }

  /**
   * Remove Bearer token
   */
  removeBearerToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization']
    this.logger.log('Bearer token removed')
  }

  /**
   * Get current Bearer token
   */
  getCurrentBearerToken(): string | undefined {
    const authHeader = this.axiosInstance.defaults.headers.common['Authorization']
    return typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options?: HttpClientOptions): Promise<ApiResponse<T>> {
    try {
      const config = this.buildRequestConfig(options)
      const response = await this.axiosInstance.get(url, config)

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, options?: HttpClientOptions): Promise<ApiResponse<T>> {
    try {
      const config = this.buildRequestConfig(options)
      const response = await this.axiosInstance.post(url, data, config)

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, options?: HttpClientOptions): Promise<ApiResponse<T>> {
    try {
      const config = this.buildRequestConfig(options)
      const response = await this.axiosInstance.put(url, data, config)

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, options?: HttpClientOptions): Promise<ApiResponse<T>> {
    try {
      const config = this.buildRequestConfig(options)
      const response = await this.axiosInstance.patch(url, data, config)

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options?: HttpClientOptions): Promise<ApiResponse<T>> {
    try {
      const config = this.buildRequestConfig(options)
      const response = await this.axiosInstance.delete(url, config)

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Download file from URL
   */
  async downloadFile(url: string, options?: HttpClientOptions): Promise<ApiResponse<Buffer>> {
    try {
      const config = this.buildRequestConfig({
        ...options,
        headers: {
          ...options?.headers,
        },
      })

      config.responseType = 'arraybuffer'

      const response = await this.axiosInstance.get(url, config)

      return {
        success: true,
        data: Buffer.from(response.data),
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Make request with retry mechanism
   */
  async requestWithRetry<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    options?: HttpClientOptions & { maxRetries?: number },
  ): Promise<ApiResponse<T>> {
    const maxRetries = options?.maxRetries || 3
    const retryDelay = options?.retryDelay || 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let result: ApiResponse<T>

        switch (method) {
          case 'GET':
            result = await this.get<T>(url, options)
            break
          case 'POST':
            result = await this.post<T>(url, data, options)
            break
          case 'PUT':
            result = await this.put<T>(url, data, options)
            break
          case 'PATCH':
            result = await this.patch<T>(url, data, options)
            break
          case 'DELETE':
            result = await this.delete<T>(url, options)
            break
        }

        if (result.success) {
          return result
        }

        // If not successful and it's the last attempt, return the result
        if (attempt === maxRetries) {
          return result
        }
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed for ${method} ${url}. Retrying...`)

        if (attempt === maxRetries) {
          return this.handleError(error)
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    }
  }

  /**
   * Check if URL is reachable
   */
  async ping(url: string, options?: HttpClientOptions): Promise<boolean> {
    try {
      const result = await this.get(url, { ...options, timeout: 5000 })
      return result.success
    } catch (error) {
      return false
    }
  }

  /**
   * Fetch data from multiple URLs concurrently
   */
  async fetchMultiple<T = any>(urls: string[], options?: HttpClientOptions): Promise<ApiResponse<T>[]> {
    const promises = urls.map((url) => this.get<T>(url, options))
    return Promise.all(promises)
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(options?: HttpClientOptions): any {
    return {
      timeout: options?.timeout,
      headers: options?.headers,
      baseURL: options?.baseURL,
    }
  }

  /**
   * Handle errors uniformly
   */
  private handleError(error: any): ApiResponse {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data?.message || error.message || 'Server Error',
        status: error.response.status,
        headers: error.response.headers,
      }
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Network Error - No response received',
      }
    } else {
      // Other error
      return {
        success: false,
        error: error.message || 'Unknown Error',
      }
    }
  }

  /**
   * Create a new instance with custom configuration
   */
  createCustomInstance(customConfig: any): HttpClientService {
    // This method would need to be implemented differently with dependency injection
    // For now, we'll create a basic instance with merged config
    const mergedConfig = { ...this.config, ...customConfig }
    const newAxiosInstance = axios.create({
      baseURL: mergedConfig.baseURL,
      timeout: mergedConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BEE-Service/2.0',
        ...(mergedConfig.bearerToken && {
          Authorization: `Bearer ${mergedConfig.bearerToken}`,
        }),
      },
    })

    // Note: This returns a partial implementation
    // In a real scenario, you'd want to use NestJS factory providers
    const customService = Object.create(HttpClientService.prototype)
    customService.axiosInstance = newAxiosInstance
    customService.config = mergedConfig
    customService.logger = this.logger

    return customService
  }
}
