import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class SubjectListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mã môn học') })
  @Trim()
  @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Mã môn học', 50) })
  code?: string

  /**
   * Chuyển đổi DTO thành filter options cho repository
   */
  toSubjectFilterOptions() {
    return {
      search: this.search,
      code: this.code,
      fromDate: this.fromDate,
      toDate: this.toDate,
    }
  }

  /**
   * Chuyển đổi thành pagination options cho repository
   */
  toSubjectPaginationOptions() {
    const sortField = this.sortBy || 'createdAt'
    const sortDirection = this.sortOrder || 'desc'

    // Validate sort field
    const allowedSortFields = [
      'subjectId',
      'name',
      'code',
    ]

    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'name'

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: validSortField,
      sortOrder: sortDirection,
    }
  }

  /**
   * Validate sort field có hợp lệ không
   */
  validateSubjectSortFields(): boolean {
    const allowedFields = [
      'subjectId',
      'name',
      'code',
    ]

    if (!this.sortBy) return true
    return allowedFields.includes(this.sortBy)
  }
}
