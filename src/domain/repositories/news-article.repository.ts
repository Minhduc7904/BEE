import { NewsArticleEntity, NewsArticleJson } from '../entities'
import { NewsArticleType, Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface CreateNewsArticleData {
  type?: NewsArticleType
  title: string
  slug: string
  excerpt?: string | null
  contentJson?: NewsArticleJson | null
  contentHtml?: string | null
  contentText?: string | null
  authorName?: string | null
  publishedAt?: Date | null
  targetKeyword?: string | null
  keywordText?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  canonicalUrl?: string | null
  searchIntent?: string | null
  seoScore?: number | null
  structuredData?: NewsArticleJson | null
  visibility?: Visibility
  isFeatured?: boolean
  readingTime?: number | null
  sortOrder?: number
  createdBy?: number | null
  updatedBy?: number | null
}

export interface UpdateNewsArticleData extends Partial<CreateNewsArticleData> {}

export interface NewsArticleListOptions {
  skip: number
  take: number
  sortBy: string
  sortOrder: SortOrder
  search?: string
  type?: NewsArticleType
  visibility?: Visibility
  isFeatured?: boolean
}

export interface INewsArticleRepository {
  create(data: CreateNewsArticleData): Promise<NewsArticleEntity>
  findById(newsArticleId: number): Promise<NewsArticleEntity | null>
  findBySlug(slug: string): Promise<NewsArticleEntity | null>
  findAllWithPagination(options: NewsArticleListOptions): Promise<{
    data: NewsArticleEntity[]
    total: number
  }>
  update(newsArticleId: number, data: UpdateNewsArticleData): Promise<NewsArticleEntity>
  incrementViewCount(newsArticleId: number): Promise<NewsArticleEntity>
  delete(newsArticleId: number): Promise<void>
}
