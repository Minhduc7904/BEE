// src/application/dtos/videoContent/update-video-content.dto.ts
import { IsString, IsOptional } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'

export class UpdateVideoContentDto {
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsOptional()
    @Trim()
    content?: string
}
