// src/application/dtos/temp-exam/create-temp-exam.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max, MinLength, MaxLength } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ExamVisibility } from '../../../shared/enums'

export class CreateTempExamDto {
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tiêu đề') })
  @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Tiêu đề', 3) })
  @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Tiêu đề', 200) })
  @Trim()
  title: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  @Trim()
  description?: string

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Khối') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối', 1) })
  @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối', 12) })
  grade?: number

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
  subjectId?: number

  @IsOptional()
  @IsEnum(ExamVisibility, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái hiển thị') })
  visibility?: ExamVisibility

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Link Youtube lời giải') })
  @Trim()
  solutionYoutubeUrl?: string

  @IsOptional()
  metadata?: any

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Nội dung thô') })
  rawContent?: string
}
