import { BookEntity, BookStructuredData } from '../entities'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface BookRelationOptions {
  includeCategories?: boolean
}

export interface CreateBookData {
  sku: string
  isbn?: string | null
  title: string
  slug: string
  shortDescription?: string | null
  content?: string | null
  author?: string | null
  publisher?: string | null
  priceVnd: number
  visibility?: Visibility
  isFeatured?: boolean
  targetKeyword?: string | null
  keywordText?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  canonicalUrl?: string | null
  searchIntent?: string | null
  seoScore?: number | null
  structuredData?: BookStructuredData
  categoryIds: number[]
}

export interface BookListOptions extends BookRelationOptions {
  skip: number
  take: number
  sortBy: 'bookId' | 'title' | 'priceVnd' | 'isFeatured' | 'viewCount' | 'createdAt' | 'updatedAt'
  sortOrder: SortOrder
  search?: string
  visibility?: Visibility
  isFeatured?: boolean
  categorySlugs?: string[]
}

export interface IBookRepository {
  create(data: CreateBookData): Promise<BookEntity>
  findById(bookId: number, options?: BookRelationOptions): Promise<BookEntity | null>
  findBySlug(slug: string, options?: BookRelationOptions): Promise<BookEntity | null>
  findBySku(sku: string): Promise<BookEntity | null>
  findByIsbn(isbn: string): Promise<BookEntity | null>
  findAllWithPagination(options: BookListOptions): Promise<{ data: BookEntity[]; total: number }>
  update(bookId: number, data: Partial<CreateBookData>): Promise<BookEntity>
  incrementViewCount(bookId: number): Promise<BookEntity>
  delete(bookId: number): Promise<void>
}
