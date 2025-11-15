import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { BaseResponseDto } from '../../dtos'
import { MediaResponseDto } from '../../dtos/media'

@Injectable()
export class GetMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(mediaId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    
    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    return BaseResponseDto.success(
      'Media retrieved successfully',
      MediaResponseDto.fromEntity(media)
    )
  }
}
