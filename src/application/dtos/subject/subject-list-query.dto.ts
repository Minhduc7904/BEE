import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalString } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
/**
 * DTO for querying subject list with filters and pagination
 * Extends ListQueryDto for common pagination and sorting fields
 * 
 * Filter fields:
 * - Code (Mã môn học)
 */
export class SubjectListQueryDto extends ListQueryDto {
  /**
   * Filter by subject code
   * @optional
   * @maxLength 50
   */
  @IsOptionalString('Mã môn học', 50)
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
    const sortDirection = this.sortOrder || SortOrder.DESC

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
