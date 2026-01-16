import { IsOptional, IsInt, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { ListQueryDto } from '../pagination/list-query.dto'
import { AttendanceStatus } from 'src/shared/enums'
import {
  AttendanceFilterOptions,
  AttendancePaginationOptions,
} from '../../../domain/interface/attendance/attendance.interface'

export class AttendanceListQueryDto extends ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID buổi học phải là số nguyên' })
  sessionId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  studentId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID lớp học phải là số nguyên' })
  classId?: number

  @IsOptional()
  @IsEnum(AttendanceStatus, { message: 'Trạng thái điểm danh không hợp lệ' })
  status?: AttendanceStatus

  toAttendanceFilterOptions(): AttendanceFilterOptions {
    return {
      sessionId: this.sessionId,
      studentId: this.studentId,
      classId: this.classId,
      status: this.status,
      search: this.search,
      fromDate: this.fromDate,
      toDate: this.toDate,
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
