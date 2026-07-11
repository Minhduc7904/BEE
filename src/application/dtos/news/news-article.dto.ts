import { NewsArticleEntity } from 'src/domain/entities'
import type { NewsArticleJson } from 'src/domain/entities'
import {
  IsOptionalBoolean,
  IsOptionalDate,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalObject,
  IsOptionalString,
  IsRequiredEnumValue,
  IsRequiredObject,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { NewsArticleType, Visibility } from 'src/shared/enums'

export class CreateNewsArticleDto {
  @IsOptionalBoolean('Tu dong tao SEO bang AI')
  auto?: boolean

  @IsRequiredEnumValue(NewsArticleType, 'Loai bai viet')
  type: NewsArticleType

  @IsRequiredString('Tieu de bai viet', 255, 2)
  title: string

  @IsOptionalString('Tom tat', 500)
  excerpt?: string

  @IsRequiredObject('Noi dung Tiptap')
  contentJson: NewsArticleJson

  @IsOptionalString('Noi dung HTML')
  contentHtml?: string

  @IsOptionalString('Noi dung text')
  contentText?: string

  @IsOptionalInt('Media thumbnail', 1)
  thumbnailMediaId?: number | null

  @IsOptionalString('Ten tac gia', 255)
  authorName?: string

  @IsOptionalDate('Thoi diem xuat ban')
  publishedAt?: string | null

  @IsOptionalString('Tu khoa chinh', 255)
  targetKeyword?: string

  @IsOptionalString('Danh sach tu khoa')
  keywordText?: string

  @IsOptionalString('Meta title', 255)
  metaTitle?: string

  @IsOptionalString('Meta description', 500)
  metaDescription?: string

  @IsOptionalString('OG title', 255)
  ogTitle?: string

  @IsOptionalString('OG description', 500)
  ogDescription?: string

  @IsOptionalString('Canonical URL', 1000)
  canonicalUrl?: string

  @IsOptionalString('Search intent', 100)
  searchIntent?: string

  @IsOptionalInt('Diem SEO', 0, 100)
  seoScore?: number

  @IsOptionalObject('Du lieu JSON-LD')
  structuredData?: NewsArticleJson

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Bai viet noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thoi gian doc', 1)
  readingTime?: number

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class UpdateNewsArticleDto {
  @IsOptionalEnumValue(NewsArticleType, 'Loai bai viet')
  type?: NewsArticleType

  @IsOptionalString('Tieu de bai viet', 255, 2)
  title?: string

  @IsOptionalString('Tom tat', 500)
  excerpt?: string | null

  @IsOptionalObject('Noi dung Tiptap')
  contentJson?: NewsArticleJson

  @IsOptionalString('Noi dung HTML')
  contentHtml?: string | null

  @IsOptionalString('Noi dung text')
  contentText?: string | null

  @IsOptionalInt('Media thumbnail', 1)
  thumbnailMediaId?: number | null

  @IsOptionalString('Ten tac gia', 255)
  authorName?: string | null

  @IsOptionalDate('Thoi diem xuat ban')
  publishedAt?: string | null

  @IsOptionalString('Tu khoa chinh', 255)
  targetKeyword?: string | null

  @IsOptionalString('Danh sach tu khoa')
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

  @IsOptionalInt('Diem SEO', 0, 100)
  seoScore?: number | null

  @IsOptionalObject('Du lieu JSON-LD')
  structuredData?: NewsArticleJson | null

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Bai viet noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thoi gian doc', 1)
  readingTime?: number | null

  @IsOptionalInt('Thu tu sap xep', 0)
  sortOrder?: number
}

export class NewsArticleMediaResponseDto {
  mediaId: number
  type: string
  mimeType: string
  viewUrl: string
}

export class NewsArticleResponseDto {
  newsArticleId: number
  type: NewsArticleType
  title: string
  slug: string
  excerpt: string | null
  contentJson?: NewsArticleJson | null
  contentHtml: string | null
  contentText?: string | null
  thumbnailMediaId: number | null = null
  thumbnailViewUrl: string | null = null
  contentMedia?: NewsArticleMediaResponseDto[]
  authorName: string | null
  publishedAt: Date | null
  targetKeyword: string | null
  keywordText: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  canonicalUrl: string | null
  searchIntent: string | null
  seoScore: number | null
  structuredData: NewsArticleJson | null
  visibility: Visibility
  isFeatured: boolean
  viewCount: number
  readingTime: number | null
  sortOrder: number
  createdBy: number | null
  updatedBy: number | null
  createdAt: Date
  updatedAt: Date

  static fromEntity(entity: NewsArticleEntity): NewsArticleResponseDto {
    const dto = new NewsArticleResponseDto()
    Object.assign(dto, entity)
    return dto
  }

  static fromEntityList(entities: NewsArticleEntity[]): NewsArticleResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }

  static fromEntityListItem(entity: NewsArticleEntity): NewsArticleResponseDto {
    const dto = this.fromEntity(entity)
    delete dto.contentJson
    delete dto.contentText
    delete dto.contentMedia
    return dto
  }

  static fromEntityListItems(entities: NewsArticleEntity[]): NewsArticleResponseDto[] {
    return entities.map((entity) => this.fromEntityListItem(entity))
  }
}
