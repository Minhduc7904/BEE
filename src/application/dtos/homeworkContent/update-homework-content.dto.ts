// src/application/dtos/homeworkContent/update-homework-content.dto.ts
import { IsString, IsInt, IsOptional, IsBoolean, IsDate } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class UpdateHomeworkContentDto {
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsOptional()
    @Trim()
    content?: string

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
