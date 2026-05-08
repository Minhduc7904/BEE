import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import {
  CreateSeoMediaItemDto,
  SeoMediaItemResponseDto,
} from 'src/application/dtos/seo-media'
import type { ISeoMediaItemRepository } from 'src/domain/repositories/seo-media-item.repository'
import type { ISeoMediaSlotRepository } from 'src/domain/repositories/seo-media-slot.repository'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { buildPublicObjectPath } from 'src/shared/utils'

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

    const duplicated = await this.seoMediaItemRepository.findBySlotAndObjectKey(
      dto.slotId,
      objectKey,
    )
    if (duplicated) {
      throw new ConflictException('Image already exists in this SEO slot')
    }

    const item = await this.seoMediaItemRepository.create(
      {
        slotId: dto.slotId,
        bucketName,
        objectKey,
        publicUrl: buildPublicObjectPath(bucketName, objectKey),
        originalName: dto.originalName.trim(),
        mimeType: dto.mimeType.trim(),
        fileSize: dto.fileSize,
        width: dto.width,
        height: dto.height,
        sortOrder: dto.sortOrder,
        alt: dto.alt?.trim() || undefined,
        linkUrl: dto.linkUrl?.trim() || undefined,
      },
      {
        includeSlot: true,
      },
    )

    return BaseResponseDto.success(
      'SEO media item created successfully',
      SeoMediaItemResponseDto.fromEntity(item),
    )
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

    if (!/^images\/\d{4}\/\d{2}\/.+/.test(objectKey)) {
      throw new BadRequestException('SEO media objectKey must be uploaded by SEO media upload API')
    }

    return objectKey
  }

  private normalizeSeoObjectKey(inputObjectKey: string): string {
    return inputObjectKey
      .trim()
      .replace(/^\/+/, '')
      .replace(/^minio\/seo-media\//, '')
      .replace(/^seo-media\//, '')
  }
}
