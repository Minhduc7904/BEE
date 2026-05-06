import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'

@Injectable()
export class DeleteSeoMediaItemUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
  ) {}

  async execute(
    itemId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    const existed = await this.seoMediaItemRepository.findById(itemId)
    if (!existed) {
      throw new NotFoundException(`SEO media item with ID ${itemId} not found`)
    }

    await this.seoMediaItemRepository.delete(itemId)

    return BaseResponseDto.success('SEO media item deleted successfully', {
      deleted: true,
      message: 'SEO media item deleted successfully',
    })
  }
}
