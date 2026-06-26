import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import { CreateSeoMediaItemDto, SeoMediaItemResponseDto } from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { buildPublicObjectPath, detectMediaType } from 'src/shared/utils'
import { MediaType } from 'src/shared/enums'

@Injectable()
export class CreateSeoMediaItemUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(dto: CreateSeoMediaItemDto): Promise<BaseResponseDto<SeoMediaItemResponseDto>> {
    const slot = await this.seoMediaSlotRepository.findById(dto.slotId)
    if (!slot) {
      throw new NotFoundException(`SEO media slot with ID ${dto.slotId} not found`)
    }

    const bucketName = this.getSeoBucketName(dto.bucketName)
    const objectKey = this.getSeoObjectKey(dto.objectKey)
    const mediaType = this.getSeoMediaType(dto.mediaType, dto.mimeType, objectKey)

    const duplicated = await this.seoMediaItemRepository.findBySlotAndObjectKey(dto.slotId, objectKey)
    if (duplicated) {
      throw new ConflictException('Media already exists in this SEO slot')
    }

    const item = await this.seoMediaItemRepository.create(
      {
        slotId: dto.slotId,
        bucketName,
        objectKey,
        publicUrl: buildPublicObjectPath(bucketName, objectKey),
        originalName: dto.originalName.trim(),
        mimeType: dto.mimeType.trim(),
        mediaType,
        fileSize: dto.fileSize,
        width: dto.width,
        height: dto.height,
        duration: mediaType === MediaType.VIDEO ? (dto.duration ?? null) : null,
        sortOrder: dto.sortOrder,
        alt: dto.alt?.trim() || undefined,
        linkUrl: dto.linkUrl?.trim() || undefined,
      },
      {
        includeSlot: true,
      },
    )

    return BaseResponseDto.success('SEO media item created successfully', SeoMediaItemResponseDto.fromEntity(item))
  }

  private getSeoBucketName(inputBucketName?: string): string {
    const seoBucketName = this.minioService.getBuckets().seoMedia
    const bucketName = inputBucketName?.trim()

    if (bucketName && bucketName !== seoBucketName) {
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

  private getSeoMediaType(inputMediaType: MediaType | undefined, mimeType: string, objectKey: string): MediaType {
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
