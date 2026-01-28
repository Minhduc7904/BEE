// src/application/dtos/lesson/lesson-list-query.dto.ts
import { IsOptional, IsNumber, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { LessonFilterOptions, LessonPaginationOptions } from '../../../domain/interface/lesson/lesson.interface'
import { ToNumber } from 'src/shared/decorators'
export class LessonListQueryDto {
  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: 'Page phải là số' })
  @Min(1, { message: 'Page phải lớn hơn 0' })
  page?: number = 1

  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: 'Limit phải là số' })
  @Min(1, { message: 'Limit phải lớn hơn 0' })
  limit?: number = 10

  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: 'Course ID phải là số' })
  courseId?: number

  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: 'Teacher ID phải là số' })
  teacherId?: number

  @IsOptional()
  @IsString({ message: 'Search phải là chuỗi' })
  search?: string

  @IsOptional()
  @IsString({ message: 'Sort by phải là chuỗi' })
  sortBy?: string = 'createdAt'

  @IsOptional()
  @IsString({ message: 'Sort order phải là asc hoặc desc' })
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
