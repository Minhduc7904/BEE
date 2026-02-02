// src/application/dtos/temp-question/update-temp-question.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max, MinLength } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { QuestionType, Difficulty } from '../../../shared/enums'

export class UpdateTempQuestionDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Nội dung câu hỏi') })
  @MinLength(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Nội dung câu hỏi', 1) })
  @Trim()
  content?: string

  @IsOptional()
  @IsEnum(QuestionType, { message: VALIDATION_MESSAGES.FIELD_INVALID('Loại câu hỏi') })
  type?: QuestionType

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Đáp án đúng') })
  @Trim()
  correctAnswer?: string

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Lời giải') })
  @Trim()
  solution?: string

  @IsOptional()
  @IsEnum(Difficulty, { message: VALIDATION_MESSAGES.FIELD_INVALID('Độ khó') })
  difficulty?: Difficulty

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Link Youtube lời giải') })
  @Trim()
  solutionYoutubeUrl?: string

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Khối') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối', 1) })
  @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối', 12) })
  grade?: number

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
  subjectId?: number

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Điểm gốc') })
  @Min(0, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Điểm gốc', 0) })
  pointsOrigin?: number

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Section') })
  tempSectionId?: number

  @IsOptional()
  metadata?: any
}
