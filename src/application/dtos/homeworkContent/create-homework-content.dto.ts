// src/application/dtos/homeworkContent/create-homework-content.dto.ts
import { IsNotEmpty, IsString, IsInt, IsOptional, IsBoolean, IsDate } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class CreateHomeworkContentDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('learningItemId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('learningItemId') })
    @ToNumber()
    learningItemId: number

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('content') })
    @Trim()
    content: string

    @IsDate({ message: VALIDATION_MESSAGES.FIELD_INVALID('dueDate') })
    @IsOptional()
    @Type(() => Date)
    dueDate?: Date

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('competitionId') })
    @IsOptional()
    @ToNumber()
    competitionId?: number

    @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('allowLateSubmit') })
    @IsOptional()
    allowLateSubmit?: boolean
}
