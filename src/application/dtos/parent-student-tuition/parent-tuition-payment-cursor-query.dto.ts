import { IsOptionalInt, IsOptionalTuitionCursor, IsRequiredEnumValue } from '../../../shared/decorators/validate'
import { TuitionPaymentStatus } from '../../../shared/enums'
import { decodeTuitionCursor, ParentTuitionPaymentListQuery } from '../../interfaces'

export class ParentTuitionPaymentCursorQueryDto {
  @IsRequiredEnumValue(TuitionPaymentStatus, 'Trạng thái học phí')
  status: TuitionPaymentStatus

  @IsOptionalTuitionCursor('Con trỏ phân trang')
  after?: string

  @IsOptionalInt('Kích thước trang', 1, 100)
  limit?: number = 10

  toQuery(): ParentTuitionPaymentListQuery {
    return {
      status: this.status,
      after: this.after ? decodeTuitionCursor(this.after) : null,
      limit: Math.min(100, Math.max(1, this.limit ?? 10)),
    }
  }
}
