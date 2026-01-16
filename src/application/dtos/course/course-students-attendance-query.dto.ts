// src/application/dtos/course/course-students-attendance-query.dto.ts
import { Type } from 'class-transformer'
import { IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { AttendanceStatus } from 'src/shared/enums'

/**
 * DTO for querying students attendance by course
 * Requires fromDate and toDate to filter attendance records
 */
export class CourseStudentsAttendanceQueryDto extends ListQueryDto {
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Từ ngày') })
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Từ ngày') })
    declare fromDate: string // Override to make required

    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Đến ngày') })
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Đến ngày') })
    declare toDate: string // Override to make required

    @IsOptional()
    @IsEnum(AttendanceStatus, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái điểm danh') })
    status?: AttendanceStatus // Optional filter by attendance status

    /**
     * Convert DTO to filter options for repository
     */
    toFilterOptions() {
        return {
            fromDate: new Date(this.fromDate),
            toDate: new Date(this.toDate),
            search: this.search,
            status: this.status,
        }
    }

    /**
     * Convert DTO to pagination options
     */
    toPaginationOptions() {
        return {
            page: this.page || 1,
            limit: this.limit || 10,
            sortBy: this.sortBy || 'studentId',
            sortOrder: this.sortOrder || 'asc',
        }
    }
}
