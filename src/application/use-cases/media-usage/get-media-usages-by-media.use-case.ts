// src/application/use-cases/media/GetMediaUsagesByMediaUseCase.ts

import { Injectable, Inject } from '@nestjs/common'
import type { IMediaUsageRepository, IMediaRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos'
import { MediaUsageResponseDto } from '../../dtos/media-usage'
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { MediaVisibility, MediaStatus } from 'src/shared/enums'

/**
 * GetMediaUsagesByMediaUseCase - Find where a media is used
 */
@Injectable()
export class GetMediaUsagesByMediaUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) { }

  async execute(
    mediaId: number,
    userId?: number,
  ): Promise<BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>> {
    const media = await this.mediaRepository.findById(mediaId)

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found or has no usages`)
    }

    if (media.status === MediaStatus.DELETED) {
      throw new ConflictException(`Media with ID ${mediaId} has been deleted`)
    }

    const usages = await this.mediaUsageRepository.findByMedia(mediaId)

    let filteredUsages = usages

    // 1️⃣ Chưa đăng nhập → chỉ PUBLIC
    if (!userId) {
      filteredUsages = usages.filter(
        (u) => u.visibility === MediaVisibility.PUBLIC
      )
    }
    // 2️⃣ Đã đăng nhập nhưng KHÔNG phải uploader
    else if (media.uploadedBy !== userId) {
      filteredUsages = usages.filter(
        (u) =>
          u.visibility === MediaVisibility.PUBLIC ||
          u.visibility === MediaVisibility.PROTECTED
      )
    }
    // 3️⃣ uploader → xem tất cả (giữ nguyên usages)

    return BaseResponseDto.success('Media usages retrieved successfully', {
      data: filteredUsages.map((u) => MediaUsageResponseDto.fromEntity(u)),
      total: filteredUsages.length,
    })
  }
}
