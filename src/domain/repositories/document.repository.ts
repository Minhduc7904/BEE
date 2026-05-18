import { DocumentEntity } from '../entities'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface CreateDocumentData {
  title: string
  slug: string
  shortDescription?: string | null
  content?: string | null
  sourceName?: string | null
  sourceUrl?: string | null
  targetKeyword?: string | null
  keywordText?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  searchIntent?: string | null
  seoScore?: number | null
  visibility?: Visibility
  isFeatured?: boolean
  readingTime?: number | null
  createdBy?: number | null
  updatedBy?: number | null
  tagIds?: number[]
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {}

export interface DocumentListOptions {
  skip: number
  take: number
  sortBy: string
  sortOrder: SortOrder
  search?: string
  visibility?: Visibility
  isFeatured?: boolean
  requiredTagId?: number
  tagId?: number
  tagIds?: number[]
  includeTags?: boolean
}

export interface IDocumentRepository {
  create(data: CreateDocumentData): Promise<DocumentEntity>
  findById(documentId: number, includeTags?: boolean): Promise<DocumentEntity | null>
  findBySlug(slug: string, includeTags?: boolean): Promise<DocumentEntity | null>
  findAllWithPagination(options: DocumentListOptions): Promise<{ data: DocumentEntity[]; total: number }>
  update(documentId: number, data: UpdateDocumentData): Promise<DocumentEntity>
  incrementViewCount(documentId: number): Promise<DocumentEntity>
  incrementDownloadCount(documentId: number): Promise<DocumentEntity>
  delete(documentId: number): Promise<void>
}
