import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  GetSeoMediaSlotDetailQueryDto,
  SeoMediaSlotListResponseDto,
  SeoMediaSlotResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class GetSeoMediaSlotByCodeUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    code: string,
    query: GetSeoMediaSlotDetailQueryDto,
  ): Promise<SeoMediaSlotListResponseDto> {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const [slots, total] = await Promise.all([
      this.seoMediaSlotRepository.findAll({
        code,
        includeItems: query.includeItems,
        skip,
        take: limit,
      }),
      this.seoMediaSlotRepository.count({ code }),
    ])

    if (total === 0) {
      throw new NotFoundException(`SEO media slot with code "${code}" not found`)
    }

    return new SeoMediaSlotListResponseDto(
      SeoMediaSlotResponseDto.fromEntityList(slots),
      page,
      limit,
      total,
    )
  }
}
