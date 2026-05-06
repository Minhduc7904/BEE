import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import { SeoMediaSlotResponseDto } from 'src/application/dtos/seo-media'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class GetSeoMediaSlotByIdUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    slotId: number,
    options?: {
      includeItems?: boolean
    },
  ): Promise<BaseResponseDto<SeoMediaSlotResponseDto>> {
    const slot = await this.seoMediaSlotRepository.findById(slotId, options)
    if (!slot) {
      throw new NotFoundException(`SEO media slot with ID ${slotId} not found`)
    }

    return BaseResponseDto.success(
      'SEO media slot retrieved successfully',
      SeoMediaSlotResponseDto.fromEntity(slot),
    )
  }
}
