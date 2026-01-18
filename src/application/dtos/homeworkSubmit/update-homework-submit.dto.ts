// src/application/dtos/homeworkSubmit/update-homework-submit.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'

export class UpdateHomeworkSubmitDto {
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsOptional()
    @Trim()
    content?: string
}
