// src/application/dtos/homeworkSubmit/create-homework-submit.dto.ts
import { IsNotEmpty, IsString, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'

export class CreateHomeworkSubmitDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('homeworkContentId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('homeworkContentId') })
    @Type(() => Number)
    homeworkContentId: number

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('studentId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('studentId') })
    @Type(() => Number)
    studentId: number

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('content') })
    @Trim()
    content: string
}
