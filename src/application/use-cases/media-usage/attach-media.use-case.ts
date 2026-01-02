import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MediaStatus } from '@prisma/client'
import { BaseResponseDto } from '../../dtos'
import { AttachMediaDto, MediaUsageResponseDto } from '../../dtos/media-usage'

/**
 * AttachMediaUseCase - Attach media to an entity
 * 
 * RESPONSIBILITIES:
 * ✅ Validate media exists and is ready
 * ✅ Check for duplicate attachments
 * ✅ Create MediaUsage record
 * 
 * SECURITY:
 * - Visibility controlled at attachment level
 * - Authorization should be checked at Guard/Service layer
 */
@Injectable()
export class AttachMediaUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(dto: AttachMediaDto, userId: number) {
    // Validate media exists and is ready
    const media = await this.mediaRepository.findById(dto.mediaId)
    // console.log('Media found for attachment:', media);
    if (!media) {
      throw new NotFoundException(`Media with ID ${dto.mediaId} not found`)
    }

    if (media.status !== MediaStatus.READY) {
      throw new ConflictException('Media is not ready for attachment')
    }

    // Check for duplicate attachment
    const exists = await this.mediaUsageRepository.exists(
      dto.mediaId,
      dto.entityType,
      dto.entityId,
      dto.fieldName,
    )

    if (exists) {
      throw new ConflictException('Media already attached to this entity')
    }

    // Create attachment
    const usage = await this.mediaUsageRepository.attach({
      mediaId: dto.mediaId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      fieldName: dto.fieldName,
      usedBy: userId,
      visibility: dto.visibility,
    })

    return BaseResponseDto.success(
      'Media attached successfully',
      MediaUsageResponseDto.fromEntity(usage),
    )
  }
}
