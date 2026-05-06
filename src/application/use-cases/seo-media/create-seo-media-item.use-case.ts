import {
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
import { normalizeStoredPublicPath } from 'src/shared/utils'

@Injectable()
export class CreateSeoMediaItemUseCase {
  constructor(
    @Inject('ISeoMediaItemRepository')
    private readonly seoMediaItemRepository: ISeoMediaItemRepository,
    @Inject('ISeoMediaSlotRepository')
    private readonly seoMediaSlotRepository: ISeoMediaSlotRepository,
  ) {}

  async execute(dto: CreateSeoMediaItemDto): Promise<BaseResponseDto<SeoMediaItemResponseDto>> {
    const slot = await this.seoMediaSlotRepository.findById(dto.slotId)
    if (!slot) {
      throw new NotFoundException(`SEO media slot with ID ${dto.slotId} not found`)
    }

    const duplicated = await this.seoMediaItemRepository.findBySlotAndObjectKey(
      dto.slotId,
      dto.objectKey.trim(),
    )
    if (duplicated) {
      throw new ConflictException('Image already exists in this SEO slot')
    }

    const item = await this.seoMediaItemRepository.create(
      {
        slotId: dto.slotId,
        bucketName: dto.bucketName.trim(),
        objectKey: dto.objectKey.trim(),
        publicUrl: normalizeStoredPublicPath(
          dto.publicUrl,
          dto.bucketName.trim(),
          dto.objectKey.trim(),
        ),
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
}
