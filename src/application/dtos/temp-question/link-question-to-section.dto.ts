// src/application/dtos/temp-question/link-question-to-section.dto.ts
import { IsNumber, IsOptional } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class LinkQuestionToSectionDto {
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Section ID') })
  tempSectionId?: number | null
}
