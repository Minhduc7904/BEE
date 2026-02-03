// src/application/dtos/youtubeContent/update-youtube-content.dto.ts
import { IsOptionalString } from 'src/shared/decorators/validate'
import { IsUrl } from 'class-validator'

/**
 * DTO for updating YouTube content
 * 
 * @description Used to update an existing YouTube video content item
 */
export class UpdateYoutubeContentDto {
    /**
     * Content description
     * @optional
     * @example 'Updated: Introduction to Math Lesson 1'
     */
    @IsOptionalString('Mô tả nội dung')
    content?: string

    /**
     * YouTube video URL
     * @optional
     * @example 'https://www.youtube.com/watch?v=newVideoId'
     */
    @IsOptionalString('URL YouTube')
    @IsUrl({}, { message: 'YouTube URL must be a valid URL' })
    youtubeUrl?: string
}
