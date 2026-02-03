// src/application/dtos/videoContent/video-content-list-query.dto.ts
import { IsOptionalInt, IsOptionalIdNumber, IsOptionalString } from 'src/shared/decorators/validate'
import { IsIn } from 'class-validator'

/**
 * DTO for querying video content list
 * 
 * @description Used to query and filter video content with pagination and sorting
 */
export class VideoContentListQueryDto {
  /**
   * Page number (min: 1)
   * @optional
   * @default 1
   * @example 1
   */
  @IsOptionalInt('Số trang', 1)
  page?: number = 1

  /**
   * Items per page (min: 1, max: 100)
   * @optional
   * @default 10
   * @example 10
   */
  @IsOptionalInt('Số lượng/trang', 1, 100)
  limit?: number = 10

  /**
   * Sort by field
   * @optional
   * @default 'createdAt'
   * @example 'createdAt'
   */
  @IsOptionalString('Sắp xếp theo')
  sortBy?: string = 'createdAt'

  /**
   * Sort order
   * @optional
   * @default 'desc'
   * @example 'asc'
   */
  @IsOptionalString('Thứ tự sắp xếp')
  @IsIn(['asc', 'desc'], { message: 'Thứ tự sắp xếp phải là asc hoặc desc' })
  sortOrder?: 'asc' | 'desc' = 'desc'

  /**
   * Filter by learning item ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID learning item')
  learningItemId?: number

  /**
   * Search keyword
   * @optional
   * @example 'lecture'
   */
  @IsOptionalString('Từ khóa tìm kiếm')
  search?: string
}
