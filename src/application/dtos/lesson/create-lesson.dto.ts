// src/application/dtos/lesson/create-lesson.dto.ts
import { IsString, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class CreateLessonDto {
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('Khóa học') })
  courseId: number

  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tiêu đề bài học') })
  @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Tiêu đề bài học', 3) })
  @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Tiêu đề bài học', 200) })
  @Trim()
  title: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  @Trim()
  description?: string

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giáo viên') })
  teacherId?: number
}
