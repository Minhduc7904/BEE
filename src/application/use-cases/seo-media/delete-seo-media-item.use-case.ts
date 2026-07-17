import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import { MinioService } from 'src/application/interfaces'

@Injectable()
export class DeleteSeoMediaItemUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    itemId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    const existed = await this.seoMediaItemRepository.findById(itemId)
    if (!existed) {
      throw new NotFoundException(`SEO media item with ID ${itemId} not found`)
    }

    try {
      await this.minioService.deleteFile(existed.bucketName, existed.objectKey)
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error
      }
    }

    await this.seoMediaItemRepository.delete(itemId)

    return BaseResponseDto.success('SEO media item deleted successfully', {
      deleted: true,
      message: 'SEO media item deleted successfully',
    })
  }
}
