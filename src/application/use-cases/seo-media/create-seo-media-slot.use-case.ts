import { ConflictException, Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import {
  CreateSeoMediaSlotDto,
  SeoMediaSlotResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class CreateSeoMediaSlotUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(dto: CreateSeoMediaSlotDto): Promise<BaseResponseDto<SeoMediaSlotResponseDto>> {
    const existed = await this.seoMediaSlotRepository.findByCode(dto.code.trim())
    if (existed) {
      throw new ConflictException(`SEO media slot code "${dto.code}" already exists`)
    }

    const slot = await this.seoMediaSlotRepository.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      pageKey: dto.pageKey?.trim() || null,
      type: dto.type?.trim() || undefined,
      description: dto.description?.trim() || undefined,
      isActive: dto.isActive,
      minItems: dto.minItems,
      maxItems: dto.maxItems ?? null,
      recommendedWidth: dto.recommendedWidth ?? null,
      recommendedHeight: dto.recommendedHeight ?? null,
      metadata: dto.metadata ?? null,
    })

    return BaseResponseDto.success(
      'SEO media slot created successfully',
      SeoMediaSlotResponseDto.fromEntity(slot),
    )
  }
}
