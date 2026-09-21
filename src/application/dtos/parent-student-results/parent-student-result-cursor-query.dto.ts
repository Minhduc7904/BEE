import { IsOptionalInt, IsOptionalResultCursor } from '../../../shared/decorators/validate'
import { decodeResultCursor, ParentResultCursor } from '../../interfaces/parent-result-cursor.interface'

export class ParentStudentResultCursorQueryDto {
  @IsOptionalResultCursor('Con trỏ phân trang')
  after?: string

  @IsOptionalInt('Kích thước trang', 1, 100)
  limit?: number = 10

  toPagination(): { after: ParentResultCursor | null; limit: number } {
    return {
      after: this.after ? decodeResultCursor(this.after) : null,
      limit: Math.min(100, Math.max(1, this.limit ?? 10)),
    }
  }
}
