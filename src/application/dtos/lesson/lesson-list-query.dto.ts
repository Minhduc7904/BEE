// src/application/dtos/lesson/lesson-list-query.dto.ts
import { LessonFilterOptions, LessonPaginationOptions } from '../../../domain/interface/lesson/lesson.interface'
import { IsOptionalInt, IsOptionalIdNumber, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO for querying lesson list with filters and pagination
 * 
 * Filter fields:
 * - Course ID (Khóa học)
 * - Teacher ID (Giáo viên)
 * - Search keyword (Tìm kiếm)
 * 
 * Pagination fields:
 * - Page, Limit, Sort By, Sort Order
 */
export class LessonListQueryDto {
  /**
   * Page number
   * @optional
   * @default 1
   * @min 1
   */
  @IsOptionalInt('Page', 1)
  page?: number = 1

  /**
   * Items per page
   * @optional
   * @default 10
   * @min 1
   */
  @IsOptionalInt('Limit', 1)
  limit?: number = 10

  /**
   * Filter by course ID
   * @optional
   */
  @IsOptionalIdNumber('Course ID')
  courseId?: number

  /**
   * Filter by teacher ID
   * @optional
   */
  @IsOptionalIdNumber('Teacher ID')
  teacherId?: number

  /**
   * Search keyword
   * @optional
   */
  @IsOptionalString('Search')
  search?: string

  /**
   * Sort field
   * @optional
   * @default 'createdAt'
   */
  @IsOptionalString('Sort by')
  sortBy?: string = 'createdAt'

  /**
   * Sort order (asc or desc)
   * @optional
   * @default 'desc'
   */
  @IsOptionalString('Sort order')
  sortOrder?: 'asc' | 'desc' = 'desc'

  toLessonFilterOptions(): LessonFilterOptions {
    return {
      courseId: this.courseId,
      teacherId: this.teacherId,
      search: this.search,
    }
  }

  toLessonPaginationOptions(): LessonPaginationOptions {
    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: this.sortBy || 'createdAt',
      sortOrder: this.sortOrder || 'desc',
    }
  }
}
