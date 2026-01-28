// src/application/dtos/student/student-list-query.dto.ts
import { Type } from 'class-transformer'
import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator'
import { ListQueryDto } from '..'
import { Trim, ToBoolean } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ToNumber } from 'src/shared/decorators'

export class StudentListQueryDto extends ListQueryDto {
  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Lớp') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Lớp', 1) })
  @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Lớp', 12) })
  grade?: number

  @IsOptional()
  @ToBoolean()
  @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái hoạt động') })
  isActive?: boolean

  /**
   * Chuyển đổi DTO thành filter options cho repository
   */
  toStudentFilterOptions() {
    return {
      grade: this.grade,
      isActive: this.isActive,
      search: this.search, // Sử dụng flat property từ ListQueryDto
      fromDate: this.fromDate, // Sử dụng flat property từ ListQueryDto
      toDate: this.toDate, // Sử dụng flat property từ ListQueryDto
    }
  }

  /**
   * Chuyển đổi thành pagination options cho repository
   */
  toStudentPaginationOptions() {
    const sortField = this.sortBy || 'createdAt' // Sử dụng flat property
    const sortDirection = this.sortOrder || 'desc' // Sử dụng flat property

    // Validate sort field
    const allowedSortFields = [
      'studentId',
      'userId',
      'grade',
      'school',
      'username',
      'email',
      'firstName',
      'lastName',
      'createdAt',
      'updatedAt',
      'lastLoginAt',
    ]

    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt'

    return {
      page: this.page || 1, // Sử dụng flat property
      limit: this.limit || 10, // Sử dụng flat property
      sortBy: {
        field: validSortField as any,
        direction: sortDirection,
      },
    }
  }

  /**
   * Validate sort field
   */
  validateStudentSortFields(): boolean {
    const allowedFields = [
      'studentId',
      'userId',
      'grade',
      'school',
      'username',
      'email',
      'firstName',
      'lastName',
      'createdAt',
      'updatedAt',
      'lastLoginAt',
    ]

    if (!this.sortBy) return true // Sử dụng flat property
    return allowedFields.includes(this.sortBy)
  }
}
