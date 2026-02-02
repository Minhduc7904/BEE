// src/application/dtos/chapter/chapter-search-query.dto.ts
import { IsOptional, IsString, MaxLength, IsNumber } from 'class-validator'
import { VALIDATION_MESSAGES } from 'src/shared/constants'
import { ToNumber } from 'src/shared/decorators'
import { Trim } from 'src/shared/decorators/trim.decorator'
import { ListQueryDto } from '../pagination/list-query.dto'
export class ChapterSearchQueryDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Từ khóa tìm kiếm') })
  @Trim()
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Từ khóa tìm kiếm', 255) })
  search?: string

  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
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
