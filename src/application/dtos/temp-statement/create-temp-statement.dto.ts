// src/application/dtos/temp-statement/create-temp-statement.dto.ts
import { IsString, IsBoolean, IsOptional, IsNumber, IsEnum, MinLength, Min } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Difficulty } from '../../../shared/enums'

export class CreateTempStatementDto {
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Nội dung đáp án') })
  @MinLength(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Nội dung đáp án', 1) })
  @Trim()
  content: string

  @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Đáp án đúng/sai') })
  isCorrect: boolean

  @IsOptional()
  @IsEnum(Difficulty, { message: VALIDATION_MESSAGES.FIELD_INVALID('Độ khó') })
  difficulty?: Difficulty

  @IsOptional()
  metadata?: any
}
