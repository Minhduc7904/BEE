// src/application/dtos/pagination-response.dto.ts

export class PaginationMetaDto {
  page: number

  limit: number

  total: number

  totalPages: number

  hasPrevious: boolean

  hasNext: boolean

  previousPage?: number

  nextPage?: number

  constructor(page: number, limit: number, total: number) {
    this.page = page
    this.limit = limit
    this.total = total
    this.totalPages = Math.ceil(total / limit)
    this.hasPrevious = page > 1
    this.hasNext = page < this.totalPages
    this.previousPage = this.hasPrevious ? page - 1 : undefined
    this.nextPage = this.hasNext ? page + 1 : undefined
  }
}

export class PaginationResponseDto<TData = any> {
  success: boolean

  message: string

  data: TData[]

  meta: PaginationMetaDto

  constructor(success: boolean, message: string, data: TData[], meta: PaginationMetaDto) {
    this.success = success
    this.message = message
    this.data = data
    this.meta = meta
  }

  static success<T>(message: string, data: T[], page: number, limit: number, total: number): PaginationResponseDto<T> {
    const meta = new PaginationMetaDto(page, limit, total)
    return new PaginationResponseDto(true, message, data, meta)
  }

  static error<T>(message: string, page: number = 1, limit: number = 10): PaginationResponseDto<T> {
    const meta = new PaginationMetaDto(page, limit, 0)
    return new PaginationResponseDto(false, message, [], meta)
  }
}
