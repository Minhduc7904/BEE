import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos'
import { MediaRawContentResponseDto } from '../../dtos/media'
import { MinioService } from '../../../infrastructure/services'

@Injectable()
export class GetMyMediaRawContentUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    mediaId: number,
    userId: number,
    expirySeconds = 3600,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    /* ------------------------------------------------------------------
     * 1. Get media
     * ------------------------------------------------------------------ */
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException('Media not found')
    }

    /* ------------------------------------------------------------------
     * 2. Ownership check
     * ------------------------------------------------------------------ */
    if (media.uploadedBy !== userId) {
      throw new ForbiddenException('You can only access raw content of your own media')
    }

    if (!media.rawContent) {
      throw new NotFoundException('This media does not have raw content')
    }

    /* ------------------------------------------------------------------
     * 3. Get child media (OCR images)
     * ------------------------------------------------------------------ */
    const childMedia = await this.mediaRepository.findByParentId(mediaId)

    /* ------------------------------------------------------------------
     * 4. Generate presigned URLs
     * ------------------------------------------------------------------ */
    const mediaIdToUrlMap = new Map<number, string>()

    await Promise.all(
      childMedia.map(async (child) => {
        try {
          const url = await this.minioService.getPresignedUrl(child.bucketName, child.objectKey, expirySeconds)
          mediaIdToUrlMap.set(child.mediaId, url)
        } catch (err) {
          console.error(`Failed to generate presigned URL for media ${child.mediaId}`, err)
        }
      }),
    )

    /* ------------------------------------------------------------------
     * 5. Replace markdown image
     * Pattern: ![media:75](media:75)
     * 👉 mediaId lấy từ ALT [media:75]
     * ------------------------------------------------------------------ */
    let replacedImagesCount = 0

    const imagePattern = /!\[media:(\d+)\]\([^)]+\)/g

    const processedContent = media.rawContent.replace(imagePattern, (match, mediaIdStr) => {
      const id = Number(mediaIdStr)
      const url = mediaIdToUrlMap.get(id)

      if (!url) return match

      replacedImagesCount++
      return `![media:${id}](${url})`
    })

    /* ------------------------------------------------------------------
     * 6. Build response
     * ------------------------------------------------------------------ */
    return BaseResponseDto.success('Raw content retrieved successfully', {
      mediaId: media.mediaId,
      rawContent: media.rawContent,
      processedContent,
      childMediaCount: childMedia.length,
      metadata: {
        replacedImagesCount,
        childMediaIds: childMedia.map((m) => m.mediaId),
        presignedExpirySeconds: expirySeconds,
      },
    })
  }
}
