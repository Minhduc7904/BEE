// src/application/dtos/videoContent/create-video-content.dto.ts
import { IsRequiredIdNumber, IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for creating video content
 * 
 * @description Used to create a new video content item for a learning item
 */
export class CreateVideoContentDto {
    /**
     * Learning item ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID mục học')
    learningItemId: number

    /**
     * Video URL or video description
     * @required
     * @example '/videos/lesson-1.mp4'
     */
    @IsRequiredString('Nội dung video')
    content: string
}
