// src/application/dtos/pagination-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'

export class PaginationMetaDto {
  @ApiProperty(SWAGGER_PROPERTIES.PAGE)
  page: number

  @ApiProperty(SWAGGER_PROPERTIES.LIMIT)
  limit: number

  @ApiProperty(SWAGGER_PROPERTIES.TOTAL)
  total: number

  @ApiProperty(SWAGGER_PROPERTIES.TOTAL_PAGES)
  totalPages: number

  @ApiProperty(SWAGGER_PROPERTIES.HAS_PREVIOUS)
  hasPrevious: boolean

  @ApiProperty(SWAGGER_PROPERTIES.HAS_NEXT)
  hasNext: boolean

  @ApiProperty(SWAGGER_PROPERTIES.PREVIOUS_PAGE)
  previousPage?: number

  @ApiProperty(SWAGGER_PROPERTIES.NEXT_PAGE)
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
  @ApiProperty(SWAGGER_PROPERTIES.SUCCESS)
  success: boolean

  @ApiProperty(SWAGGER_PROPERTIES.MESSAGE)
  message: string

  @ApiProperty({ description: 'Danh sách dữ liệu', type: 'array' })
  data: TData[]

  @ApiProperty({ ...SWAGGER_PROPERTIES.META, type: PaginationMetaDto })
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
