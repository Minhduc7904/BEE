// src/application/dtos/student/student-list-query.dto.ts
import { ListQueryDto } from '..'
import { ToBoolean } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ToNumber } from 'src/shared/decorators'
import { IsOptionalBoolean, IsOptionalInt } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
/**
 * DTO truy vấn danh sách học sinh
 * @description Chứa các tham số lọc và phân trang cho danh sách học sinh
 */
export class StudentListQueryDto extends ListQueryDto {
  /**
   * Khối lớp (1-12)
   * @optional
   * @example 10
   */
  @ToNumber()
  @IsOptionalInt('Lớp', 1, 12)
  grade?: number

  /**
   * Trạng thái hoạt động
   * @optional
   * @example true
   */
  @ToBoolean()
  @IsOptionalBoolean('Trạng thái hoạt động')
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
    const sortDirection = this.sortOrder || SortOrder.DESC // Sử dụng flat property

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
