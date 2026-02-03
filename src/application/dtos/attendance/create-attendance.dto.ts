import { AttendanceStatus } from 'src/shared/enums'
import { IsRequiredEnumValue, IsRequiredIdNumber, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO tạo bản ghi điểm danh
 * @description Chứa thông tin để tạo một bản ghi điểm danh cho học sinh
 */
export class CreateAttendanceDto {
  /**
   * ID buổi học
   * @required
   * @example 10
   */
  @IsRequiredIdNumber('ID buổi học')
  sessionId: number

  /**
   * ID học sinh
   * @required
   * @example 15
   */
  @IsRequiredIdNumber('ID học sinh')
  studentId: number

  /**
   * Trạng thái điểm danh
   * @required
   * @example "PRESENT"
   */
  @IsRequiredEnumValue(AttendanceStatus, 'Trạng thái điểm danh')
  status: AttendanceStatus

  /**
   * Ghi chú (tối đa 500 ký tự)
   * @optional
   * @example "Học sinh đi muộn"
   */
  @IsOptionalString('Ghi chú', 500)
  notes?: string
}
