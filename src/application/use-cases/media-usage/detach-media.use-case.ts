import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos'

/**
 * DetachMediaUseCase - Detach media from entity
 */
@Injectable()
export class DetachMediaUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  async execute(usageId: number) {
    const usage = await this.mediaUsageRepository.findById(usageId)
    
    if (!usage) {
      throw new NotFoundException(`Media usage with ID ${usageId} not found`)
    }

    await this.mediaUsageRepository.detach(usageId)

    return BaseResponseDto.success('Media detached successfully', {
      deleted: true,
      message: 'Media attachment removed',
    })
  }
}
