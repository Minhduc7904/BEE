// src/application/use-cases/youtubeContent/get-youtube-content-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IYoutubeContentRepository } from '../../../domain/repositories'
import { YoutubeContentResponseDto } from '../../dtos/youtubeContent/youtube-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetYoutubeContentByIdUseCase {
    constructor(
        @Inject('IYoutubeContentRepository')
        private readonly youtubeContentRepository: IYoutubeContentRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<YoutubeContentResponseDto>> {
        const youtubeContent = await this.youtubeContentRepository.findById(id)

        if (!youtubeContent) {
            throw new NotFoundException(`Youtube content with ID ${id} not found`)
        }

        const dto = YoutubeContentResponseDto.fromEntity(youtubeContent)
        return BaseResponseDto.success('Youtube content retrieved successfully', dto)
    }
}
