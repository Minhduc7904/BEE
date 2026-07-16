export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type PaginatedResponse<T> = { data: T[]; meta: PaginationMeta }

export class PaginationUtil {
  static calculateMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit + 1
    const endIndex = Math.min(page * limit, total)

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      startIndex: total > 0 ? startIndex : 0,
      endIndex: total > 0 ? endIndex : 0,
    }
  }

  static createResult<T>(data: T[], page: number, limit: number, total: number): PaginationResult<T> {
    const meta = this.calculateMeta(page, limit, total)
    return { data, total: meta.total, page: meta.page, limit: meta.limit, totalPages: meta.totalPages, hasNextPage: meta.hasNextPage, hasPreviousPage: meta.hasPreviousPage }
  }

  static createResponse<T>(data: T[], page: number, limit: number, total: number): PaginatedResponse<T> {
    return { data, meta: this.calculateMeta(page, limit, total) }
  }

  static validateParams(page: number, limit: number): { page: number; limit: number } {
    return { page: Math.max(1, Math.floor(page)), limit: Math.max(1, Math.min(100, Math.floor(limit))) }
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit
  }

  static getDefaultOptions(): { page: number; limit: number } {
    return { page: 1, limit: 10 }
  }

  static mergeWithDefaults<T>(options?: Partial<{ page: number; limit: number; sortBy?: T }>): { page: number; limit: number; sortBy?: T } {
    const defaults = this.getDefaultOptions()
    return { page: options?.page ?? defaults.page, limit: options?.limit ?? defaults.limit, sortBy: options?.sortBy }
  }
}
