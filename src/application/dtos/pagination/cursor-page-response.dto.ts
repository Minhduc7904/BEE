export class CursorPageMetaDto {
  hasNext: boolean

  nextCursor: string | null

  limit: number

  constructor(hasNext: boolean, nextCursor: string | null, limit: number) {
    this.hasNext = hasNext
    this.nextCursor = nextCursor
    this.limit = limit
  }
}

export class CursorPageResponseDto<TData = any> {
  success: boolean

  message: string

  data: TData[]

  meta: CursorPageMetaDto

  constructor(success: boolean, message: string, data: TData[], meta: CursorPageMetaDto) {
    this.success = success
    this.message = message
    this.data = data
    this.meta = meta
  }

  static success<T>(message: string, data: T[], hasNext: boolean, nextCursor: string | null, limit: number): CursorPageResponseDto<T> {
    const meta = new CursorPageMetaDto(hasNext, nextCursor, limit)
    return new CursorPageResponseDto(true, message, data, meta)
  }

  static error<T>(message: string, limit: number = 10): CursorPageResponseDto<T> {
    const meta = new CursorPageMetaDto(false, null, limit)
    return new CursorPageResponseDto(false, message, [], meta)
  }
}
