import { ListQueryDto } from '../pagination/list-query.dto'
import { AttendanceStatus } from 'src/shared/enums'
import {
  AttendanceFilterOptions,
  AttendancePaginationOptions,
} from '../../../domain/interface/attendance/attendance.interface'
import { IsOptionalIdNumber, IsOptionalEnumValue } from 'src/shared/decorators/validate'

export class AttendanceListQueryDto extends ListQueryDto {
  @IsOptionalIdNumber('ID buổi học')
  sessionId?: number

  @IsOptionalIdNumber('ID học sinh')
  studentId?: number

  @IsOptionalIdNumber('ID lớp học')
  classId?: number

  @IsOptionalEnumValue(AttendanceStatus, 'Trạng thái điểm danh')
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
