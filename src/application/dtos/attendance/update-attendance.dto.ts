import { AttendanceStatus, AttendanceType } from 'src/shared/enums'
import { IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật bản ghi điểm danh
 * @description Chứa các trường có thể cập nhật của bản ghi điểm danh
 */
export class UpdateAttendanceDto {
  /**
   * Trạng thái điểm danh
   * @optional
   * @example "ABSENT"
   */
  @IsOptionalEnumValue(AttendanceStatus, 'Trạng thái điểm danh')
  status?: AttendanceStatus

  @IsOptionalEnumValue(AttendanceType, 'Loại điểm danh')
  attendanceType?: AttendanceType

  /**
   * Ghi chú
   * @optional
   * @example "Đi muộn 15 phút"
   */
  @IsOptionalString('Ghi chú')
  notes?: string
}
