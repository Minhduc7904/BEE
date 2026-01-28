// src/application/dtos/documentContent/create-document-content.dto.ts
import { IsNotEmpty, IsString, IsInt, IsOptional, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class CreateDocumentContentDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('learningItemId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('learningItemId') })
    @ToNumber()
    learningItemId: number

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('content') })
    @Trim()
    content: string

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('orderInDocument') })
    @IsOptional()
    @ToNumber()
    orderInDocument?: number
}
