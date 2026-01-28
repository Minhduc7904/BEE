// src/application/dtos/homeworkSubmit/grade-homework-submit.dto.ts
import { IsNotEmpty, IsString, IsInt, IsOptional, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class GradeHomeworkSubmitDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('points') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('points') })
    @Min(0, { message: VALIDATION_MESSAGES.FIELD_MIN('points', 0) })
    @Max(100, { message: VALIDATION_MESSAGES.FIELD_MAX('points', 100) })
    @ToNumber()
    points: number

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('graderId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('graderId') })
    @ToNumber()
    graderId: number

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('feedback') })
    @IsOptional()
    @Trim()
    feedback?: string
}
