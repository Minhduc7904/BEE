// src/application/dtos/videoContent/update-video-content.dto.ts
import { IsOptionalString, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for updating video content
 * 
 * @description Used to update an existing video content item
 */
export class UpdateVideoContentDto {
    /**
     * Video URL or video description
     * @optional
     * @example '/videos/lesson-1-updated.mp4'
     */
    @IsOptionalString('Nội dung video')
    content?: string

    /**
     * Media ID for video file
     * @optional
     * @example 123
     */
    @IsOptionalIdNumber('ID media')
    mediaId?: number
}
