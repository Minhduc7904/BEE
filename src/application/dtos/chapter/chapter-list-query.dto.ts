import { IsOptional, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ListQueryDto } from '../pagination/list-query.dto'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ToNumber } from 'src/shared/decorators'

export class ChapterListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID môn học') })
  @ToNumber()
  @Min(1)
  subjectId?: number

  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID chương cha') })
  @ToNumber()
  @Min(1)
  parentChapterId?: number

  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Cấp độ') })
  @ToNumber()
  @Min(0)
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
    const sortDirection = this.sortOrder || 'asc'

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
