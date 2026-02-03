import { AttendanceStatus } from 'src/shared/enums'
import { IsRequiredIdNumber, IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO tạo hàng loạt attendance cho tất cả học sinh trong 1 buổi học
 * @description Tự động tạo bản ghi điểm danh cho tất cả học sinh trong buổi học
 */
export class CreateBulkAttendanceBySessionDto {
  /**
   * ID buổi học
   * @required
   * @example 10
   */
  @IsRequiredIdNumber('ID buổi học')
  sessionId: number

  /**
   * Trạng thái điểm danh (mặc định PRESENT nếu không truyền)
   * @optional
   * @example "PRESENT"
   */
  @IsOptionalEnumValue(AttendanceStatus, 'Trạng thái điểm danh')
  status?: AttendanceStatus

  /**
   * Ghi chú (tối đa 500 ký tự)
   * @optional
   * @example "Buổi học thứ 5"
   */
  @IsOptionalString('Ghi chú', 500)
  notes?: string
}
