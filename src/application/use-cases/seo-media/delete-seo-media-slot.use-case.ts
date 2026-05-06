import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'

@Injectable()
export class DeleteSeoMediaSlotUseCase {
  constructor(
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    slotId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    const existed = await this.seoMediaSlotRepository.findById(slotId)
    if (!existed) {
      throw new NotFoundException(`SEO media slot with ID ${slotId} not found`)
    }

    await this.seoMediaSlotRepository.delete(slotId)

    return BaseResponseDto.success('SEO media slot deleted successfully', {
      deleted: true,
      message: 'SEO media slot deleted successfully',
    })
  }
}
