// src/application/dtos/learningItem/create-learning-item.dto.ts
import { IsEnum, IsNotEmpty, IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { LearningItemType } from '../../../shared/enums'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from '../../../shared/decorators'

export class CreateLearningItemDto {
    @IsEnum(LearningItemType, { message: VALIDATION_MESSAGES.FIELD_INVALID('type') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('type') })
    type: LearningItemType

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('title') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('title') })
    @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN('title', 3) })
    @MaxLength(200, { message: VALIDATION_MESSAGES.FIELD_MAX('title', 200) })
    @Trim()
    title: string

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('description') })
    @IsOptional()
    @MaxLength(1000, { message: VALIDATION_MESSAGES.FIELD_MAX('description', 1000) })
    @Trim()
    description?: string

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('competitionId') })
    @IsOptional()
    @ToNumber()
    competitionId?: number

    @ToNumber()
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('lessonId') })
    @IsOptional()
    lessonId?: number

    @ToNumber()
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('order') })
    @IsOptional()
    order?: number
}
