import { ListQueryDto } from '../pagination/list-query.dto'
import { AttendanceStatus } from 'src/shared/enums'
import {
  AttendanceFilterOptions,
  AttendancePaginationOptions,
} from '../../../domain/interface/attendance/attendance.interface'
import { IsOptionalIdNumber, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Trạng thái lọc học phí dùng cho query attendance
 * - PAID: đã nộp học phí trong tháng/năm chỉ định
 * - UNPAID: chưa nộp học phí (có record nhưng status = UNPAID)
 * - NO_TUITION: không có bản ghi học phí nào cho tháng/năm đó
 */
export enum TuitionFilterStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  NO_TUITION = 'NO_TUITION',
}

export class AttendanceListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID buổi học')
  sessionId?: number

  @IsOptionalIdNumber('ID homework content')
  homeworkContentId?: number

  @IsOptionalIdNumber('ID học sinh')
  studentId?: number

  @IsOptionalIdNumber('ID lớp học')
  classId?: number

  @IsOptionalEnumValue(AttendanceStatus, 'Trạng thái điểm danh')
  status?: AttendanceStatus

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1-12' })
  @Max(12, { message: 'Tháng phải từ 1-12' })
  month?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm phải từ 2000 trở lên' })
  @Max(2100, { message: 'Năm phải nhỏ hơn 2100' })
  year?: number

  /** Lọc theo trạng thái học phí: PAID | UNPAID | NO_TUITION (bắt buộc kèm month và year) */
  @IsOptional()
  @IsEnum(TuitionFilterStatus, { message: 'tuitionStatus phải là PAID, UNPAID hoặc NO_TUITION' })
  tuitionStatus?: TuitionFilterStatus

  toAttendanceFilterOptions(): AttendanceFilterOptions {
    return {
      sessionId: this.sessionId,
      studentId: this.studentId,
      classId: this.classId,
      status: this.status,
      search: this.search,
      fromDate: this.fromDate,
      toDate: this.toDate,
      month: this.month,
      year: this.year,
    }
  }

  toAttendancePaginationOptions(): AttendancePaginationOptions {
    const allowedSortFields = ['attendanceId', 'markedAt', 'status']

    const sortBy = allowedSortFields.includes(this.sortBy || '')
      ? this.sortBy
      : 'markedAt'

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy,
      sortOrder: this.sortOrder,
    }
  }
}
