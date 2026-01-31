import { Injectable, Inject } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos'
import { EntityType } from '../../../shared/constants/entity-type.constants'
/**
 * DetachMediaByEntityUseCase - Detach all media from specific entity
 */
@Injectable()
export class DetachMediaByEntityUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  async execute(entityType: EntityType, entityId: number, fieldName?: string) {
    const deletedCount = await this.mediaUsageRepository.detachByEntity(
      entityType,
      entityId,
      fieldName,
    )

    return BaseResponseDto.success(
      'Media detached successfully',
      {
        deleted: true,
        count: deletedCount,
        message: `${deletedCount} attachment(s) removed`,
      },
    )
  }
}
