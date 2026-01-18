// src/application/dtos/lesson/create-lesson.dto.ts
import { IsString, IsOptional, IsNumber, MinLength, MaxLength, IsArray, IsEnum, IsBoolean } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Visibility } from '../../../shared/enums'
import { Type, Transform } from 'class-transformer'

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
  @IsEnum(Visibility, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái hiển thị') })
  visibility?: Visibility

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Thứ tự bài học') })
  orderInCourse?: number

  @IsOptional()
  @Transform(({ value }) => value === '' || value === null || value === undefined ? undefined : Number(value))
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giáo viên') })
  teacherId?: number

  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Cho phép học thử') })
  allowTrial?: boolean

  @IsOptional()
  @IsArray({ message: VALIDATION_MESSAGES.FIELD_INVALID('Danh sách chương') })
  @IsNumber({}, { each: true, message: VALIDATION_MESSAGES.FIELD_INVALID('ID chương') })
  @Type(() => Number)
  chapterIds?: number[]
}
