// src/application/dtos/homeworkSubmit/create-homework-submit.dto.ts
import { IsNotEmpty, IsString, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class CreateHomeworkSubmitDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('homeworkContentId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('homeworkContentId') })
    @ToNumber()
    homeworkContentId: number

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('studentId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('studentId') })
    @ToNumber()
    studentId: number

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('content') })
    @Trim()
    content: string
}
