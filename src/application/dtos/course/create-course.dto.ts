// src/application/dtos/course/create-course.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max, MinLength, MaxLength } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { CourseVisibility } from 'src/shared/enums'
export class CreateCourseDto {
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tiêu đề') })
  @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Tiêu đề', 3) })
  @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Tiêu đề', 200) })
  @Trim()
  title: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Phụ đề') })
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Phụ đề', 255) })
  @Trim()
  subtitle?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Năm học') })
  @MaxLength(9, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Năm học', 9) })
  @Trim()
  academicYear?: string

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Khối') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối', 1) })
  @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối', 12) })
  grade?: number

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
  subjectId?: number

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  @Trim()
  description?: string

  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giá') })
  @Min(0, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Giá', 0) })
  priceVND: number

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giá gốc') })
  @Min(0, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Giá gốc', 0) })
  compareAtVND?: number

  @IsOptional()
  @IsEnum(CourseVisibility, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái') })
  visibility?: CourseVisibility

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giáo viên') })
  teacherId?: number
}
