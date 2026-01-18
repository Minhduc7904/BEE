// src/application/use-cases/videoContent/get-video-content-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IVideoContentRepository } from '../../../domain/repositories'
import { VideoContentResponseDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetVideoContentByIdUseCase {
    constructor(
        @Inject('IVideoContentRepository')
        private readonly videoContentRepository: IVideoContentRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<VideoContentResponseDto>> {
        const videoContent = await this.videoContentRepository.findById(id)

        if (!videoContent) {
            throw new NotFoundException(`Video content with ID ${id} not found`)
        }

        const dto = VideoContentResponseDto.fromEntity(videoContent)
        return BaseResponseDto.success('Video content retrieved successfully', dto)
    }
}
