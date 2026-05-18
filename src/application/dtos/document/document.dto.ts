import {
  IsOptionalBoolean,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIntArray,
  IsOptionalString,
  IsOptionalIdNumber,
  IsRequiredIdNumber,
  IsRequiredString,
} from 'src/shared/decorators/validate'
import { DocumentEntity, TagEntity } from 'src/domain/entities'
import { TagType, Visibility } from 'src/shared/enums'

export class CreateDocumentDto {
  @IsRequiredString('Tieu de tai lieu', 255, 2)
  title: string

  @IsRequiredIdNumber('ID media tai lieu')
  mediaId: number

  @IsOptionalIdNumber('ID media thumbnail')
  thumbnailMediaId?: number

  @IsOptionalString('Slug tai lieu', 255, 2)
  slug?: string

  @IsOptionalString('Mo ta ngan', 500)
  shortDescription?: string

  @IsOptionalString('Noi dung')
  content?: string

  @IsOptionalInt('Trang bat dau de sinh noi dung', 1)
  contentStartPage?: number

  @IsOptionalInt('Trang ket thuc de sinh noi dung', 1)
  contentEndPage?: number

  @IsOptionalString('Ten nguon', 255)
  sourceName?: string

  @IsOptionalString('URL nguon', 1000)
  sourceUrl?: string

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

  @IsOptionalString('Search intent', 100)
  searchIntent?: string

  @IsOptionalInt('Diem SEO', 0, 100)
  seoScore?: number

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Tai lieu noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thoi gian doc', 0)
  readingTime?: number

  @IsOptionalIntArray('Danh sach tag')
  tagIds?: number[]
}

export class UpdateDocumentDto {
  @IsOptionalString('Tieu de tai lieu', 255, 2)
  title?: string

  @IsOptionalIdNumber('ID media thumbnail')
  thumbnailMediaId?: number

  @IsOptionalString('Slug tai lieu', 255, 2)
  slug?: string

  @IsOptionalString('Mo ta ngan', 500)
  shortDescription?: string

  @IsOptionalString('Noi dung')
  content?: string

  @IsOptionalString('Ten nguon', 255)
  sourceName?: string

  @IsOptionalString('URL nguon', 1000)
  sourceUrl?: string

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

  @IsOptionalString('Search intent', 100)
  searchIntent?: string

  @IsOptionalInt('Diem SEO', 0, 100)
  seoScore?: number

  @IsOptionalEnumValue(Visibility, 'Trang thai hien thi')
  visibility?: Visibility

  @IsOptionalBoolean('Tai lieu noi bat')
  isFeatured?: boolean

  @IsOptionalInt('Thoi gian doc', 0)
  readingTime?: number

  @IsOptionalIntArray('Danh sach tag')
  tagIds?: number[]
}

export class DocumentTagResponseDto {
  tagId: number
  name: string
  slug: string
  type: TagType
  description: string | null

  static fromEntity(entity: TagEntity): DocumentTagResponseDto {
    const dto = new DocumentTagResponseDto()
    dto.tagId = entity.tagId
    dto.name = entity.name
    dto.slug = entity.slug
    dto.type = entity.type
    dto.description = entity.description
    return dto
  }
}

export class DocumentResponseDto {
  documentId: number
  title: string
  slug: string
  shortDescription: string | null
  content: string | null
  processedContent?: string | null
  processedMarkdownContent?: string | null
  sourceName: string | null
  sourceUrl: string | null
  targetKeyword: string | null
  keywordText: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  searchIntent: string | null
  seoScore: number | null
  visibility: Visibility
  isFeatured: boolean
  viewCount: number
  downloadCount: number
  readingTime: number | null
  createdBy: number | null
  updatedBy: number | null
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string | null
  mediaUsages?: DocumentMediaUsageResponseDto[]
  tags?: DocumentTagResponseDto[]

  static fromEntity(entity: DocumentEntity): DocumentResponseDto {
    const dto = new DocumentResponseDto()
    dto.documentId = entity.documentId
    dto.title = entity.title
    dto.slug = entity.slug
    dto.shortDescription = entity.shortDescription
    dto.content = entity.content
    dto.sourceName = entity.sourceName
    dto.sourceUrl = entity.sourceUrl
    dto.targetKeyword = entity.targetKeyword
    dto.keywordText = entity.keywordText
    dto.metaTitle = entity.metaTitle
    dto.metaDescription = entity.metaDescription
    dto.ogTitle = entity.ogTitle
    dto.ogDescription = entity.ogDescription
    dto.searchIntent = entity.searchIntent
    dto.seoScore = entity.seoScore
    dto.visibility = entity.visibility
    dto.isFeatured = entity.isFeatured
    dto.viewCount = entity.viewCount
    dto.downloadCount = entity.downloadCount
    dto.readingTime = entity.readingTime
    dto.createdBy = entity.createdBy
    dto.updatedBy = entity.updatedBy
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    dto.tags = entity.tags
      ?.map((documentTag) => documentTag.tag)
      .filter((tag): tag is TagEntity => Boolean(tag))
      .map((tag) => DocumentTagResponseDto.fromEntity(tag))
    return dto
  }

  static fromEntityList(entities: DocumentEntity[]): DocumentResponseDto[] {
    return entities.map((entity) => this.fromEntity(entity))
  }
}

export class DocumentMediaUsageResponseDto {
  usageId: number
  mediaId: number
  fieldName: string | null
  url: string | null
  mimeType: string | null
  originalFilename: string | null

  static fromData(data: {
    usageId: number
    mediaId: number
    fieldName: string | null
    url: string | null
    mimeType: string | null
    originalFilename: string | null
  }): DocumentMediaUsageResponseDto {
    const dto = new DocumentMediaUsageResponseDto()
    Object.assign(dto, data)
    return dto
  }
}

export type DocumentSeoSectionKey =
  | 'latest'
  | 'thpt_math_review'
  | 'thpt_math_exams'
  | 'math_12'
  | 'math_11'
  | 'math_10'
  | 'grade_10_exam_review'
  | 'math_9'
  | 'math_8'
  | 'math_7'
  | 'math_6'

export class DocumentSeoSectionResponseDto {
  key: DocumentSeoSectionKey
  title: string
  documents: DocumentResponseDto[]

  static fromData(data: {
    key: DocumentSeoSectionKey
    title: string
    documents: DocumentResponseDto[]
  }): DocumentSeoSectionResponseDto {
    const dto = new DocumentSeoSectionResponseDto()
    Object.assign(dto, data)
    return dto
  }
}

export class DocumentSeoLevelResponseDto {
  level: DocumentTagResponseDto
  sections: DocumentSeoSectionResponseDto[]

  static fromData(data: {
    level: DocumentTagResponseDto
    sections: DocumentSeoSectionResponseDto[]
  }): DocumentSeoLevelResponseDto {
    const dto = new DocumentSeoLevelResponseDto()
    Object.assign(dto, data)
    return dto
  }
}
