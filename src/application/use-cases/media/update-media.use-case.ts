import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { BaseResponseDto } from '../../dtos'
import { UpdateMediaDto, MediaResponseDto } from '../../dtos/media'

@Injectable()
export class UpdateMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(mediaId: number, dto: UpdateMediaDto) {
    // Check if media exists
    const existingMedia = await this.mediaRepository.findById(mediaId)
    if (!existingMedia) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`)
    }

    // Update media
    const updatedMedia = await this.mediaRepository.update(mediaId, dto)
    
    return BaseResponseDto.success(
      'Media updated successfully',
      MediaResponseDto.fromEntity(updatedMedia)
    )
  }
}
