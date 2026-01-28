// src/application/dtos/youtubeContent/create-youtube-content.dto.ts
import { IsNotEmpty, IsString, IsInt, IsUrl } from 'class-validator'
import { Type } from 'class-transformer'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Trim } from '../../../shared/decorators'
import { ToNumber } from 'src/shared/decorators'

export class CreateYoutubeContentDto {
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('learningItemId') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('learningItemId') })
    @ToNumber()
    learningItemId: number

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('content') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('content') })
    @Trim()
    content: string

    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('youtubeUrl') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('youtubeUrl') })
    @IsUrl({}, { message: 'YouTube URL must be a valid URL' })
    @Trim()
    youtubeUrl: string
}
