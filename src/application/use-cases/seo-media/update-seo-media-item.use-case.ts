import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import {
  SeoMediaItemResponseDto,
  UpdateSeoMediaItemDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'
import { buildPublicObjectPath, normalizeStoredPublicPath } from 'src/shared/utils'

@Injectable()
export class UpdateSeoMediaItemUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(
    itemId: number,
    dto: UpdateSeoMediaItemDto,
  ): Promise<BaseResponseDto<SeoMediaItemResponseDto>> {
    const existed = await this.seoMediaItemRepository.findById(itemId)
    if (!existed) {
      throw new NotFoundException(`SEO media item with ID ${itemId} not found`)
    }

    const targetSlotId = dto.slotId ?? existed.slotId
    const targetObjectKey = dto.objectKey?.trim() ?? existed.objectKey
    const targetBucketName = dto.bucketName?.trim() ?? existed.bucketName
    const nextPublicUrl =
      dto.publicUrl !== undefined
        ? normalizeStoredPublicPath(dto.publicUrl, targetBucketName, targetObjectKey)
        : (dto.objectKey !== undefined || dto.bucketName !== undefined)
          ? buildPublicObjectPath(targetBucketName, targetObjectKey)
          : undefined

    if (dto.slotId !== undefined && dto.slotId !== existed.slotId) {
      const slot = await this.seoMediaSlotRepository.findById(dto.slotId)
      if (!slot) {
        throw new NotFoundException(`SEO media slot with ID ${dto.slotId} not found`)
      }
    }

    if (targetSlotId !== existed.slotId || targetObjectKey !== existed.objectKey) {
      const duplicated = await this.seoMediaItemRepository.findBySlotAndObjectKey(
        targetSlotId,
        targetObjectKey,
      )
      if (duplicated && duplicated.itemId !== itemId) {
        throw new ConflictException('Image already exists in this SEO slot')
      }
    }

    const updated = await this.seoMediaItemRepository.update(
      itemId,
      {
        ...(dto.slotId !== undefined && { slotId: dto.slotId }),
        ...(dto.bucketName !== undefined && { bucketName: dto.bucketName.trim() }),
        ...(dto.objectKey !== undefined && { objectKey: dto.objectKey.trim() }),
        ...(nextPublicUrl !== undefined && { publicUrl: nextPublicUrl }),
        ...(dto.originalName !== undefined && { originalName: dto.originalName.trim() }),
        ...(dto.mimeType !== undefined && { mimeType: dto.mimeType.trim() }),
        ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
        ...(dto.width !== undefined && { width: dto.width }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.alt !== undefined && { alt: dto.alt?.trim() || null }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl?.trim() || null }),
      },
      {
        includeSlot: true,
      },
    )

    return BaseResponseDto.success(
      'SEO media item updated successfully',
      SeoMediaItemResponseDto.fromEntity(updated),
    )
  }
}
