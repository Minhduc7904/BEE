import { MinioService } from 'src/application/interfaces'
import {
  BookCategoryEntity,
  BookEntity,
  BookSalesContactConfigurationEntity,
  MediaUsageEntity,
} from 'src/domain/entities'
import type { BookStructuredData } from 'src/domain/entities'
import {
  IsOptionalBoolean,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIntArray,
  IsOptionalObject,
  IsOptionalString,
  IsRequiredInt,
  IsRequiredIntArray,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { MediaType, MediaVisibility, Visibility } from 'src/shared/enums'

export class CreateBookDto {
  @IsRequiredString('SKU', 80, 1)
  sku: string

  @IsOptionalString('ISBN', 32, 1)
  isbn?: string | null

  @IsRequiredString('Tên sách', 255, 2)
  title: string

  @IsOptionalString('Slug', 255, 2)
  slug?: string

  @IsOptionalString('Mô tả ngắn', 500)
  shortDescription?: string | null

  @IsOptionalString('Nội dung')
  content?: string | null

  @IsOptionalString('Tác giả', 255)
  author?: string | null

  @IsOptionalString('Nhà xuất bản', 255)
  publisher?: string | null

  @IsRequiredInt('Giá bán', 1)
  priceVnd: number

  @IsRequiredIntArray('Danh sách loại sách')
  categoryIds: number[]

  @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
  visibility?: Visibility

  @IsOptionalBoolean('Sách nổi bật')
  isFeatured?: boolean

  @IsOptionalString('Từ khóa chính', 255)
  targetKeyword?: string | null

  @IsOptionalString('Danh sách từ khóa')
  keywordText?: string | null

  @IsOptionalString('Meta title', 255)
  metaTitle?: string | null

  @IsOptionalString('Meta description', 500)
  metaDescription?: string | null

  @IsOptionalString('OG title', 255)
  ogTitle?: string | null

  @IsOptionalString('OG description', 500)
  ogDescription?: string | null

  @IsOptionalString('Canonical URL', 1000)
  canonicalUrl?: string | null

  @IsOptionalString('Search intent', 100)
  searchIntent?: string | null

  @IsOptionalInt('Điểm SEO', 0, 100)
  seoScore?: number | null

  @IsOptionalObject('Dữ liệu JSON-LD')
  structuredData?: BookStructuredData

  @IsOptionalInt('Media cover', 1)
  coverMediaId?: number | null

  @IsOptionalInt('Media OG image', 1)
  ogImageMediaId?: number | null

  @IsOptionalIntArray('Media gallery')
  galleryMediaIds?: number[]
}

export class UpdateBookDto {
  @IsOptionalString('SKU', 80, 1)
  sku?: string

  @IsOptionalString('ISBN', 32, 1)
  isbn?: string | null

  @IsOptionalString('Tên sách', 255, 2)
  title?: string

  @IsOptionalString('Slug', 255, 2)
  slug?: string

  @IsOptionalString('Mô tả ngắn', 500)
  shortDescription?: string | null

  @IsOptionalString('Nội dung')
  content?: string | null

  @IsOptionalString('Tác giả', 255)
  author?: string | null

  @IsOptionalString('Nhà xuất bản', 255)
  publisher?: string | null

  @IsOptionalInt('Giá bán', 1)
  priceVnd?: number

  @IsOptionalIntArray('Danh sách loại sách')
  categoryIds?: number[]

  @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
  visibility?: Visibility

  @IsOptionalBoolean('Sách nổi bật')
  isFeatured?: boolean

  @IsOptionalString('Từ khóa chính', 255)
  targetKeyword?: string | null

  @IsOptionalString('Danh sách từ khóa')
  keywordText?: string | null

  @IsOptionalString('Meta title', 255)
  metaTitle?: string | null

  @IsOptionalString('Meta description', 500)
  metaDescription?: string | null

  @IsOptionalString('OG title', 255)
  ogTitle?: string | null

  @IsOptionalString('OG description', 500)
  ogDescription?: string | null

  @IsOptionalString('Canonical URL', 1000)
  canonicalUrl?: string | null

  @IsOptionalString('Search intent', 100)
  searchIntent?: string | null

  @IsOptionalInt('Điểm SEO', 0, 100)
  seoScore?: number | null

  @IsOptionalObject('Dữ liệu JSON-LD')
  structuredData?: BookStructuredData

  @IsOptionalInt('Media cover', 1)
  coverMediaId?: number | null

  @IsOptionalInt('Media OG image', 1)
  ogImageMediaId?: number | null

  @IsOptionalIntArray('Media gallery')
  galleryMediaIds?: number[]
}

export class BookCategoryResponseDto {
  bookCategoryId: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  sortOrder: number

  static fromEntity(entity: BookCategoryEntity): BookCategoryResponseDto {
    return Object.assign(new BookCategoryResponseDto(), entity)
  }

  static fromEntityList(entities: BookCategoryEntity[]): BookCategoryResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

export class BookMediaResponseDto {
  usageId: number
  mediaId: number
  fieldName: string | null
  visibility: MediaVisibility
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  type: MediaType
  viewUrl?: string
  expiresAt?: Date
  expirySeconds?: number
  width?: number
  height?: number
  duration?: number
  description?: string
  alt?: string
  createdAt: Date

  static async fromUsage(
    usage: MediaUsageEntity,
    minioService: MinioService,
    expirySeconds = 3600,
  ): Promise<BookMediaResponseDto | undefined> {
    if (!usage.media) {
      return undefined
    }

    const dto = new BookMediaResponseDto()
    dto.usageId = usage.usageId
    dto.mediaId = usage.mediaId
    dto.fieldName = usage.fieldName
    dto.visibility = usage.visibility
    dto.fileName = usage.media.objectKey.split('/').pop() || usage.media.originalFilename
    dto.originalName = usage.media.originalFilename
    dto.mimeType = usage.media.mimeType
    dto.fileSize = usage.media.fileSize
    dto.type = usage.media.type
    dto.viewUrl = await minioService.getPresignedUrl(usage.media.bucketName, usage.media.objectKey, expirySeconds)
    dto.expiresAt = new Date(Date.now() + expirySeconds * 1000)
    dto.expirySeconds = expirySeconds
    dto.width = usage.media.width
    dto.height = usage.media.height
    dto.duration = usage.media.duration
    dto.description = usage.media.description
    dto.alt = usage.media.alt
    dto.createdAt = usage.createdAt
    return dto
  }
}

export class BookResponseDto {
  bookId: number
  sku: string
  isbn: string | null
  title: string
  slug: string
  shortDescription: string | null
  content?: string | null
  author: string | null
  publisher: string | null
  priceVnd: number
  visibility: Visibility
  isFeatured: boolean
  viewCount: number
  targetKeyword: string | null
  keywordText: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  canonicalUrl: string | null
  searchIntent: string | null
  seoScore: number | null
  structuredData: BookStructuredData
  categories: BookCategoryResponseDto[] = []
  media: BookMediaResponseDto[] = []
  contact?: BookSalesContactResponseDto
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: BookEntity): BookResponseDto {
    const dto = new BookResponseDto()
    Object.assign(dto, entity)
    dto.categories = BookCategoryResponseDto.fromEntityList(entity.categories ?? [])
    return dto
  }

  static fromEntityList(entities: BookEntity[]): BookResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }

  static fromListEntity(entity: BookEntity): BookResponseDto {
    const dto = this.fromEntity(entity)
    delete dto.content
    return dto
  }
}

export class BookSalesContactResponseDto {
  phone: string
  facebookUrl: string

  static fromEntity(entity: BookSalesContactConfigurationEntity): BookSalesContactResponseDto {
    return Object.assign(new BookSalesContactResponseDto(), { phone: entity.phone, facebookUrl: entity.facebookUrl })
  }
}

export class UpdateBookSalesContactDto {
  @IsRequiredString('Hotline', 20, 3)
  phone: string

  @IsRequiredString('URL Facebook', 255, 8)
  facebookUrl: string
}
