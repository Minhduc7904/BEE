import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import { SeoMediaItemResponseDto, UpdateSeoMediaItemDto } from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { buildPublicObjectPath, detectMediaType } from 'src/shared/utils'
import { MediaType } from 'src/shared/enums'

@Injectable()
export class UpdateSeoMediaItemUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(itemId: number, dto: UpdateSeoMediaItemDto): Promise<BaseResponseDto<SeoMediaItemResponseDto>> {
    const existed = await this.seoMediaItemRepository.findById(itemId)
    if (!existed) {
      throw new NotFoundException(`SEO media item with ID ${itemId} not found`)
    }

    const targetSlotId = dto.slotId ?? existed.slotId
    const targetObjectKey = this.getSeoObjectKey(dto.objectKey?.trim() ?? existed.objectKey)
    const targetBucketName = this.getSeoBucketName(dto.bucketName?.trim() ?? existed.bucketName)
    const targetMimeType = dto.mimeType?.trim() ?? existed.mimeType
    const targetMediaType = this.getSeoMediaType(dto.mediaType ?? existed.mediaType, targetMimeType, targetObjectKey)
    const nextPublicUrl =
      dto.publicUrl !== undefined || dto.objectKey !== undefined || dto.bucketName !== undefined
        ? buildPublicObjectPath(targetBucketName, targetObjectKey)
        : undefined

    if (dto.slotId !== undefined && dto.slotId !== existed.slotId) {
      const slot = await this.seoMediaSlotRepository.findById(dto.slotId)
      if (!slot) {
        throw new NotFoundException(`SEO media slot with ID ${dto.slotId} not found`)
      }
    }

    if (targetSlotId !== existed.slotId || targetObjectKey !== existed.objectKey) {
      const duplicated = await this.seoMediaItemRepository.findBySlotAndObjectKey(targetSlotId, targetObjectKey)
      if (duplicated && duplicated.itemId !== itemId) {
        throw new ConflictException('Media already exists in this SEO slot')
      }
    }

    const updated = await this.seoMediaItemRepository.update(
      itemId,
      {
        ...(dto.slotId !== undefined && { slotId: dto.slotId }),
        ...(dto.bucketName !== undefined && { bucketName: targetBucketName }),
        ...(dto.objectKey !== undefined && { objectKey: targetObjectKey }),
        ...(nextPublicUrl !== undefined && { publicUrl: nextPublicUrl }),
        ...(dto.originalName !== undefined && { originalName: dto.originalName.trim() }),
        ...(dto.mimeType !== undefined && { mimeType: targetMimeType }),
        ...((dto.mediaType !== undefined || dto.mimeType !== undefined || dto.objectKey !== undefined) && {
          mediaType: targetMediaType,
        }),
        ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
        ...(dto.width !== undefined && { width: dto.width }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...((dto.duration !== undefined || targetMediaType !== existed.mediaType) && {
          duration: targetMediaType === MediaType.VIDEO ? (dto.duration ?? existed.duration) : null,
        }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.alt !== undefined && { alt: dto.alt?.trim() || null }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl?.trim() || null }),
      },
      {
        includeSlot: true,
      },
    )

    return BaseResponseDto.success('SEO media item updated successfully', SeoMediaItemResponseDto.fromEntity(updated))
  }

  private getSeoBucketName(inputBucketName: string): string {
    const seoBucketName = this.minioService.getBuckets().seoMedia

    if (inputBucketName && inputBucketName !== seoBucketName) {
      throw new BadRequestException(`SEO media must use bucket "${seoBucketName}"`)
    }

    return seoBucketName
  }

  private getSeoObjectKey(inputObjectKey: string): string {
    const objectKey = this.normalizeSeoObjectKey(inputObjectKey)

    if (!/^(images|videos)\/\d{4}\/\d{2}\/.+/.test(objectKey)) {
      throw new BadRequestException('SEO media objectKey must be uploaded by SEO media upload API')
    }

    return objectKey
  }

  private getSeoMediaType(inputMediaType: MediaType, mimeType: string, objectKey: string): MediaType {
    const mediaType = inputMediaType ?? detectMediaType(mimeType)
    const isSupported = [MediaType.IMAGE, MediaType.VIDEO].includes(mediaType)

    if (!isSupported) {
      throw new BadRequestException('SEO media item only supports image and video')
    }

    if (mediaType === MediaType.IMAGE && !objectKey.startsWith('images/')) {
      throw new BadRequestException('IMAGE SEO media item must use objectKey from images/')
    }

    if (mediaType === MediaType.VIDEO && !objectKey.startsWith('videos/')) {
      throw new BadRequestException('VIDEO SEO media item must use objectKey from videos/')
    }

    return mediaType
  }

  private normalizeSeoObjectKey(inputObjectKey: string): string {
    return inputObjectKey
      .trim()
      .replace(/^\/+/, '')
      .replace(/^minio\/seo-media\//, '')
      .replace(/^seo-media\//, '')
  }
}
