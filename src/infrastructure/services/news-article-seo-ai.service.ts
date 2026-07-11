import { Injectable } from '@nestjs/common'
import { OpenAIService } from './openai.service'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export interface NewsArticleSeoFields {
  targetKeyword: string
  keywordText: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  searchIntent: string
  seoScore: number
  readingTime: number
}

export interface NewsArticleSeoContext {
  type: string
  title: string
  excerpt?: string | null
  contentText: string
}

@Injectable()
export class NewsArticleSeoAiService {
  constructor(private readonly openAIService: OpenAIService) {}

  async generate(context: NewsArticleSeoContext): Promise<NewsArticleSeoFields> {
    const contentText = TextSearchUtil.stripMarkdownForSearch(context.contentText).slice(0, 12000)
    const raw = await this.openAIService.generateText(
      [
        'Generate SEO metadata for this Vietnamese education news article.',
        `Article type: ${context.type}`,
        `Title: ${context.title}`,
        `Excerpt: ${context.excerpt || '(none)'}`,
        `Content: ${contentText || '(none)'}`,
        '',
        'Return exactly this JSON object shape:',
        '{',
        '  "targetKeyword": "one primary Vietnamese keyword phrase",',
        '  "keywordText": "5-10 secondary keyword phrases separated by commas",',
        '  "metaTitle": "max 60 characters",',
        '  "metaDescription": "140-160 characters",',
        '  "ogTitle": "social sharing title",',
        '  "ogDescription": "social sharing description",',
        '  "searchIntent": "informational | educational article | course memory | announcement | event",',
        '  "seoScore": 85',
        '}',
      ].join('\n'),
      [
        'You are a Vietnamese SEO specialist for an education website.',
        'Write natural Vietnamese with diacritics. Do not keyword-stuff or use clickbait.',
        'Do not invent facts, achievements, school results, guarantees, or statistics not present in the content.',
        'Return valid JSON only. No markdown and no explanation.',
      ].join('\n'),
      { model: 'gpt-4o-mini', temperature: 0.2, maxTokens: 700 },
    )

    const parsed = this.parse(raw)
    const fallbackDescription = context.excerpt || contentText

    return {
      targetKeyword: String(parsed.targetKeyword || context.title).trim(),
      keywordText: String(parsed.keywordText || '').trim(),
      metaTitle: String(parsed.metaTitle || context.title).trim(),
      metaDescription: String(parsed.metaDescription || fallbackDescription).trim(),
      ogTitle: String(parsed.ogTitle || context.title).trim(),
      ogDescription: String(parsed.ogDescription || fallbackDescription).trim(),
      searchIntent: String(parsed.searchIntent || 'informational').trim(),
      seoScore: this.toSeoScore(parsed.seoScore),
      readingTime: this.calculateReadingTime(contentText),
    }
  }

  private parse(raw: string): Record<string, unknown> {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    return JSON.parse(cleaned) as Record<string, unknown>
  }

  private toSeoScore(value: unknown): number {
    const score = Number(value)
    return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 85
  }

  private calculateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  }
}
