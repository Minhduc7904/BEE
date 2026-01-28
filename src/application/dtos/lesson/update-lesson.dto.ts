// src/application/dtos/lesson/update-lesson.dto.ts
import { IsString, IsOptional, IsNumber, MinLength, MaxLength, IsEnum, IsBoolean, IsArray } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Visibility } from '../../../shared/enums'
import { Type, Transform } from 'class-transformer'
import { ToNumber } from 'src/shared/decorators'

export class UpdateLessonDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tiêu đề bài học') })
  @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Tiêu đề bài học', 3) })
  @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Tiêu đề bài học', 200) })
  @Trim()
  title?: string

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
  @ToNumber()
  chapterIds?: number[]
}
