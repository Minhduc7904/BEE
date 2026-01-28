// src/application/dtos/documentContent/update-document-content.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class UpdateDocumentContentDto {
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsOptional()
    @Trim()
    content?: string

    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('orderInDocument') })
    @IsOptional()
    @ToNumber()
    orderInDocument?: number
}
