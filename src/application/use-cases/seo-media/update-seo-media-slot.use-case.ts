import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import {
  SeoMediaSlotResponseDto,
  UpdateSeoMediaSlotDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class UpdateSeoMediaSlotUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    slotId: number,
    dto: UpdateSeoMediaSlotDto,
  ): Promise<BaseResponseDto<SeoMediaSlotResponseDto>> {
    const existed = await this.seoMediaSlotRepository.findById(slotId)
    if (!existed) {
      throw new NotFoundException(`SEO media slot with ID ${slotId} not found`)
    }

    const newCode = dto.code?.trim()
    if (newCode && newCode !== existed.code) {
      const duplicated = await this.seoMediaSlotRepository.findByCode(newCode)
      if (duplicated) {
        throw new ConflictException(`SEO media slot code "${newCode}" already exists`)
      }
    }

    const updated = await this.seoMediaSlotRepository.update(slotId, {
      ...(dto.code !== undefined && { code: dto.code.trim() }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.pageKey !== undefined && { pageKey: dto.pageKey?.trim() || null }),
      ...(dto.type !== undefined && { type: dto.type.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.minItems !== undefined && { minItems: dto.minItems }),
      ...(dto.maxItems !== undefined && { maxItems: dto.maxItems ?? null }),
      ...(dto.recommendedWidth !== undefined && { recommendedWidth: dto.recommendedWidth ?? null }),
      ...(dto.recommendedHeight !== undefined && { recommendedHeight: dto.recommendedHeight ?? null }),
      ...(dto.metadata !== undefined && { metadata: dto.metadata ?? null }),
    })

    return BaseResponseDto.success(
      'SEO media slot updated successfully',
      SeoMediaSlotResponseDto.fromEntity(updated),
    )
  }
}
