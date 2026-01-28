// src/application/dtos/learningItem/update-learning-item.dto.ts
import { IsEnum, IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { LearningItemType } from '../../../shared/enums'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class UpdateLearningItemDto {
    @IsEnum(LearningItemType, { message: VALIDATION_MESSAGES.FIELD_INVALID('type') })
    @IsOptional()
    type?: LearningItemType

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('title') })
    @IsOptional()
    @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN('title', 3) })
    @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX('title', 200) })
    @Trim()
    title?: string

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('description') })
    @IsOptional()
    @MaxLength(1000, { message: VALIDATION_MESSAGES.FIELD_MAX('description', 1000) })
    @Trim()
    description?: string

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('competitionId') })
    @IsOptional()
    @ToNumber()
    competitionId?: number
}
