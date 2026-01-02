import { Injectable, Inject } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos'
import { GetMediaUsageListDto, MediaUsageResponseDto } from '../../dtos/media-usage'

/**
 * GetMediaUsagesByEntityUseCase - Find all media attached to entity
 */
@Injectable()
export class GetMediaUsagesByEntityUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) { }

  async execute(dto: GetMediaUsageListDto) {
    if (!dto.entityType || !dto.entityId) {
      return BaseResponseDto.success('Media usages retrieved successfully', {
        data: [],
        total: 0,
      })
    }

    const usages = await this.mediaUsageRepository.findByEntity(
      dto.entityType,
      dto.entityId,
      dto.fieldName,
    )

    return BaseResponseDto.success('Media usages retrieved successfully', {
      data: usages.map((u) => MediaUsageResponseDto.fromEntity(u)),
      total: usages.length,
    })
  }
}
