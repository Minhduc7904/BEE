// src/application/dtos/chapter/chapter-search-query.dto.ts
import { IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for searching chapters with keyword and filters
 * 
 * Search and filter fields:
 * - Search keyword (Từ khóa tìm kiếm)
 * - Subject ID (ID môn học)
 */
export class ChapterSearchQueryDto  {
  /**
   * Search keyword for chapter name, code, or slug
   * @optional
   * @maxLength 255
   */
  @IsOptionalString('Từ khóa tìm kiếm', 255)
  search?: string

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

  /* ===================== PAGINATION (FIXED) ===================== */
  toChapterPaginationOptions() {
    return {
      page: 1,
      limit: 10,
      sortBy: 'orderInParent',
      sortOrder: 'asc' as const,
    }
  }
}
