import { Injectable, Inject } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos'
import { MediaUsageResponseDto } from '../../dtos/media-usage'

/**
 * GetMediaUsagesByMediaUseCase - Find where a media is used
 */
@Injectable()
export class GetMediaUsagesByMediaUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  async execute(mediaId: number) {
    const usages = await this.mediaUsageRepository.findByMedia(mediaId)

    return BaseResponseDto.success('Media usages retrieved successfully', {
      data: usages.map((u) => MediaUsageResponseDto.fromEntity(u)),
      total: usages.length,
    })
  }
}
