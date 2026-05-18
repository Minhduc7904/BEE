import { Visibility } from 'src/shared/enums'
import { DocumentTagEntity } from './document-tag.entity'

export class DocumentEntity {
  documentId: number
  title: string
  slug: string
  shortDescription: string | null
  content: string | null
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
  tags?: DocumentTagEntity[]

  constructor(data: {
    documentId: number
    title: string
    slug: string
    shortDescription: string | null
    content: string | null
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
    tags?: DocumentTagEntity[]
  }) {
    Object.assign(this, data)
  }

  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }
}
