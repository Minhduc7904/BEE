import type { Attendance } from 'src/domain/entities/attendance/attendance.entity'
import { AttendanceResponseDto } from './attendance.dto'

/**
 * Response của API điểm danh / hủy điểm danh: bản ghi điểm danh sau cập nhật kèm số buổi vắng liên quan.
 */
export class AttendanceCheckInResponseDto extends AttendanceResponseDto {
  /**
   * Điểm danh: số buổi vắng vừa được nối với bản ghi này.
   * Hủy điểm danh: số buổi vắng vừa được gỡ khỏi bản ghi này.
   */
  linkedAbsenceCount: number

  constructor(attendance: Attendance, linkedAbsenceCount: number) {
    super(attendance)
    this.linkedAbsenceCount = linkedAbsenceCount
  }
}
