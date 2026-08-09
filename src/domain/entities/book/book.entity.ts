import { Visibility } from 'src/shared/enums'
import { BookCategoryEntity } from './book-category.entity'

export type BookStructuredData = Record<string, unknown> | unknown[] | string | number | boolean | null

export class BookEntity {
  bookId: number
  sku: string
  isbn: string | null
  title: string
  slug: string
  shortDescription: string | null
  content: string | null
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
  createdAt: Date
  updatedAt: Date
  categories?: BookCategoryEntity[]

  constructor(data: Omit<BookEntity, 'isPublished'>) {
    Object.assign(this, data)
  }

  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }
}
