import type { BookStructuredData } from 'src/domain/entities'

export interface BookSeoAiInput {
  title: string
  shortDescription?: string | null
  content?: string | null
  author?: string | null
  publisher?: string | null
  priceVnd: number
}

export interface BookSeoFields {
  targetKeyword: string
  keywordText: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  searchIntent: string
  seoScore: number
  structuredData: BookStructuredData
}

/** Application port and Nest injection token for the Book SEO AI service. */
export abstract class BookSeoAiService {
  abstract generate(input: BookSeoAiInput): Promise<BookSeoFields>
}
