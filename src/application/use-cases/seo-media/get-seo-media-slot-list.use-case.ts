import { Inject, Injectable } from '@nestjs/common'
import {
  GetSeoMediaSlotListDto,
  SeoMediaSlotListResponseDto,
  SeoMediaSlotResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class GetSeoMediaSlotListUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    dto: GetSeoMediaSlotListDto,
  ): Promise<SeoMediaSlotListResponseDto> {
    const page = dto.page || 1
    const limit = dto.limit || 10
    const skip = (page - 1) * limit

    const [slots, total] = await Promise.all([
      this.seoMediaSlotRepository.findAll({
        isActive: dto.isActive,
        pageKey: dto.pageKey,
        type: dto.type,
        includeItems: dto.includeItems,
        skip,
        take: limit,
      }),
      this.seoMediaSlotRepository.count({
        isActive: dto.isActive,
        pageKey: dto.pageKey,
        type: dto.type,
      }),
    ])

    return new SeoMediaSlotListResponseDto(
      SeoMediaSlotResponseDto.fromEntityList(slots),
      page,
      limit,
      total,
    )
  }
}
