// src/application/dtos/youtubeContent/update-youtube-content.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'

export class UpdateYoutubeContentDto {
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsOptional()
    @Trim()
    content?: string

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('youtubeUrl') })
    @IsOptional()
    @IsUrl({}, { message: 'YouTube URL must be a valid URL' })
    @Trim()
    youtubeUrl?: string
}
