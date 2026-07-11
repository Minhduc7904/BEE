import { NewsArticleType, Visibility } from 'src/shared/enums'

export type NewsArticleJson = Record<string, unknown>

export class NewsArticleEntity {
  newsArticleId: number
  type: NewsArticleType
  title: string
  slug: string
  excerpt: string | null
  contentJson: NewsArticleJson | null
  contentHtml: string | null
  contentText: string | null
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

  constructor(data: Omit<NewsArticleEntity, 'isPublished'>) {
    Object.assign(this, data)
  }

  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }
}
