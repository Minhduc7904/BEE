import { Injectable } from '@nestjs/common'
import {
  GetSeoMediaBucketMediaListDto,
  resolveSeoBucketMediaMetadata,
  SeoMediaBucketMediaResponseDto,
} from 'src/application/dtos/seo-media'
import { PaginationResponseDto } from 'src/application/dtos/pagination/pagination-response.dto'
import { MinioService } from 'src/application/interfaces'
import { MediaType } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

type SeoMediaBucketObject = {
  name: string
  size: number
  etag?: string
  lastModified?: Date
}

@Injectable()
export class GetSeoMediaBucketMediaUseCase {
  constructor(private readonly minioService: MinioService) {}

  async execute(dto: GetSeoMediaBucketMediaListDto): Promise<PaginationResponseDto<SeoMediaBucketMediaResponseDto>> {
    const page = Math.max(1, Number(dto.page) || 1)
    const limit = Math.min(1000, Math.max(1, Number(dto.limit) || 10))
    const prefix = this.normalizePrefix(dto.prefix, dto.mediaType)
    const bucketName = this.minioService.getBuckets().seoMedia

    const objects = await this.minioService.listFiles(bucketName, prefix, true)
    const media = objects
      .filter((object) => typeof object.name === 'string')
      .map((object) => ({
        name: object.name as string,
        size: object.size,
        etag: object.etag,
        lastModified: object.lastModified,
      }))
      .filter((object) => this.isSupportedMediaObject(object.name, dto.mediaType))
      .filter((object) => this.matchesSearch(object, dto.search))
      .sort((left, right) => this.compareObjects(left, right, dto.sortBy, dto.sortOrder))

    const total = media.length
    const startIndex = (page - 1) * limit
    const data = media.slice(startIndex, startIndex + limit).map((object) =>
      SeoMediaBucketMediaResponseDto.fromData({
        bucketName,
        objectKey: object.name,
        fileSize: object.size,
        etag: object.etag,
        lastModified: object.lastModified,
      }),
    )

    return PaginationResponseDto.success('SEO media bucket media retrieved successfully', data, page, limit, total)
  }

  private normalizePrefix(prefix?: string, mediaType?: MediaType): string {
    const trimmedPrefix = prefix?.trim().replace(/^\/+/, '').replace(/\/+$/, '')
    if (!trimmedPrefix) {
      return mediaType === MediaType.IMAGE ? 'images/' : mediaType === MediaType.VIDEO ? 'videos/' : ''
    }

    if (trimmedPrefix.startsWith('images') || trimmedPrefix.startsWith('videos')) {
      return `${trimmedPrefix}/`
    }

    if (mediaType === MediaType.IMAGE) {
      return `images/${trimmedPrefix}/`
    }

    if (mediaType === MediaType.VIDEO) {
      return `videos/${trimmedPrefix}/`
    }

    return `${trimmedPrefix}/`
  }

  private isSupportedMediaObject(objectKey: string, mediaType?: MediaType): boolean {
    const metadata = resolveSeoBucketMediaMetadata(objectKey)
    const isSupported = [MediaType.IMAGE, MediaType.VIDEO].includes(metadata.mediaType)
    if (!isSupported) {
      return false
    }

    return mediaType ? metadata.mediaType === mediaType : true
  }

  private matchesSearch(object: SeoMediaBucketObject, search?: string): boolean {
    const normalizedSearch = search?.trim().toLowerCase()
    if (!normalizedSearch) {
      return true
    }

    return object.name.toLowerCase().includes(normalizedSearch)
  }

  private compareObjects(
    left: SeoMediaBucketObject,
    right: SeoMediaBucketObject,
    sortBy?: string,
    sortOrder?: SortOrder,
  ): number {
    const direction = sortOrder === SortOrder.ASC ? 1 : -1

    switch (sortBy) {
      case 'objectKey':
      case 'fileName':
        return left.name.localeCompare(right.name) * direction
      case 'fileSize':
        return ((left.size ?? 0) - (right.size ?? 0)) * direction
      case 'lastModified':
      default:
        return (this.timeOf(left.lastModified) - this.timeOf(right.lastModified)) * direction
    }
  }

  private timeOf(value?: Date): number {
    return value ? new Date(value).getTime() : 0
  }
}
