// src/application/dtos/chapter/chapter-search-query.dto.ts
import { IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'

/**
 * DTO for searching chapters with keyword and filters
 * 
 * Search and filter fields:
 * - Search keyword (Từ khóa tìm kiếm)
 * - Subject ID (ID môn học)
 */
export class ChapterSearchQueryDto extends ListQueryDto {

  /**
   * Filter by subject ID
   * @optional
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

  /* ===================== FILTER ===================== */
  toChapterFilterOptions() {
    return {
      search: this.search,
      subjectId: this.subjectId,
    }
  }

  /* ===================== PAGINATION ===================== */
  toChapterPaginationOptions() {
    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: this.sortBy || 'orderInParent',
      sortOrder: this.sortOrder || 'asc' as const,
    }
  }
}
