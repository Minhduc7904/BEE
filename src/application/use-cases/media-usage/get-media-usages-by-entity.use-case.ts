// src/application/use-cases/media/GetMediaUsagesByEntityUseCase.ts

import { Injectable, Inject } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { BaseResponseDto } from '../../dtos'
import { GetMediaUsageListDto, MediaUsageResponseDto } from '../../dtos/media-usage'
import { MediaVisibility } from 'src/shared/enums'

/**
 * GetMediaUsagesByEntityUseCase - Find all media attached to entity
 */
@Injectable()
export class GetMediaUsagesByEntityUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) { }

  async execute(
    dto: GetMediaUsageListDto,
    userId?: number,
  ): Promise<BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>> {
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

    let filteredUsages = usages

    // 1️⃣ Chưa đăng nhập → chỉ PUBLIC
    if (userId === undefined) {
    }
    // 2️⃣ Đã đăng nhập → PUBLIC + PROTECTED
    else {
      filteredUsages = usages.filter(
        (u) =>
          u.visibility === MediaVisibility.PUBLIC ||
          u.visibility === MediaVisibility.PROTECTED,
      )
    }

    return BaseResponseDto.success('Media usages retrieved successfully', {
      data: filteredUsages.map((u) =>
        MediaUsageResponseDto.fromEntity(u),
      ),
      total: filteredUsages.length,
    })
  }
}
