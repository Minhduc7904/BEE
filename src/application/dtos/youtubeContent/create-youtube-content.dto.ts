// src/application/dtos/youtubeContent/create-youtube-content.dto.ts
import { IsRequiredIdNumber, IsRequiredString } from 'src/shared/decorators/validate'
import { IsUrl } from 'class-validator'

/**
 * DTO for creating YouTube content
 * 
 * @description Used to create a new YouTube video content item for a learning item
 */
export class CreateYoutubeContentDto {
    /**
     * Learning item ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID mục học')
    learningItemId: number

    /**
     * Content description
     * @required
     * @example 'Introduction to Math Lesson 1'
     */
    @IsRequiredString('Mô tả nội dung')
    content: string

    /**
     * YouTube video URL
     * @required
     * @example 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
     */
    @IsRequiredString('URL YouTube')
    @IsUrl({}, { message: 'YouTube URL must be a valid URL' })
    youtubeUrl: string
}
