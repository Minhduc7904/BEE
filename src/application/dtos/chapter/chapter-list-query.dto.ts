import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

/**
 * DTO for querying chapter list with filters and pagination
 * Extends ListQueryDto for common pagination and sorting fields
 * 
 * Filter fields:
 * - Subject ID (ID môn học)
 * - Parent Chapter ID (ID chương cha)
 * - Level (Cấp độ)
 */
export class ChapterListQueryDto extends ListQueryDto {
  /**
   * Filter by subject ID
   * @optional
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

  /**
   * Filter by parent chapter ID
   * @optional
   */
  @IsOptionalIdNumber('ID chương cha')
  parentChapterId?: number

  /**
   * Filter by hierarchical level
   * @optional
   * @min 0
   */
  @IsOptionalInt('Cấp độ', 0)
  level?: number

  /**
   * Chuyển đổi DTO thành filter options cho repository
   */
  toChapterFilterOptions() {
    return {
      search: this.search,
      subjectId: this.subjectId,
      parentChapterId: this.parentChapterId,
      level: this.level,
      fromDate: this.fromDate,
      toDate: this.toDate,
    }
  }

  /**
   * Chuyển đổi thành pagination options cho repository
   */
  toChapterPaginationOptions() {
    const sortField = this.sortBy || 'orderInParent'
    const sortDirection = this.sortOrder || SortOrder.ASC

    // Validate sort field
    const allowedSortFields = [
      'chapterId',
      'name',
      'slug',
      'orderInParent',
      'level',
    ]

    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'orderInParent'

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
  validateChapterSortFields(): boolean {
    const allowedFields = [
      'chapterId',
      'name',
      'slug',
      'orderInParent',
      'level',
    ]

    if (!this.sortBy) return true
    return allowedFields.includes(this.sortBy)
  }
}
