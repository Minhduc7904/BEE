import { IsRequiredIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO điểm danh (check-in) một học sinh vào buổi học
 * @description Hệ thống tự tính trạng thái (Có mặt) và loại điểm danh (Chính khóa / Học bù)
 */
export class CheckInAttendanceDto {
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
}
