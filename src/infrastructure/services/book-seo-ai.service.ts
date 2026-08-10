import { Injectable } from '@nestjs/common'
import type {
  BookSeoAiInput,
  BookSeoAiService as BookSeoAiServicePort,
  BookSeoFields,
} from 'src/application/interfaces/book-seo-ai.interface'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'
import { OpenAIService } from './openai.service'

@Injectable()
export class BookSeoAiService implements BookSeoAiServicePort {
  constructor(private readonly openAiService: OpenAIService) {}

  async generate(input: BookSeoAiInput): Promise<BookSeoFields> {
    const content = TextSearchUtil.stripMarkdownForSearch(input.content ?? '').slice(0, 12000)
    const fallbackDescription = input.shortDescription?.trim() || content || input.title
    const raw = await this.openAiService.generateText(
      [
        'Generate SEO metadata for this Vietnamese book catalog entry.',
        `Title: ${input.title}`,
        `Short description: ${input.shortDescription || '(none)'}`,
        `Author: ${input.author || '(none)'}`,
        `Publisher: ${input.publisher || '(none)'}`,
        `Price in VND: ${input.priceVnd}`,
        `Content: ${content || '(none)'}`,
        '',
        'Return exactly this JSON object shape:',
        '{',
        '  "targetKeyword": "one primary Vietnamese keyword phrase",',
        '  "keywordText": "5-10 secondary keyword phrases separated by commas",',
        '  "metaTitle": "max 60 characters",',
        '  "metaDescription": "140-160 characters",',
        '  "ogTitle": "social sharing title",',
        '  "ogDescription": "social sharing description",',
        '  "searchIntent": "informational | commercial investigation",',
        '  "seoScore": 85',
        '}',
      ].join('\n'),
      [
        'You are a Vietnamese SEO specialist for an education book catalog.',
        'Write natural Vietnamese with diacritics. Do not keyword-stuff or use clickbait.',
        'Do not invent book awards, edition details, availability, benefits, guarantees, or facts not supplied.',
        'Return valid JSON only. No markdown and no explanation.',
      ].join('\n'),
      { model: 'gpt-4o-mini', temperature: 0.2, maxTokens: 700 },
    )
    const parsed = this.parse(raw)

    return {
      targetKeyword: this.text(parsed.targetKeyword, input.title),
      keywordText: this.text(parsed.keywordText),
      metaTitle: this.text(parsed.metaTitle, input.title),
      metaDescription: this.text(parsed.metaDescription, fallbackDescription),
      ogTitle: this.text(parsed.ogTitle, input.title),
      ogDescription: this.text(parsed.ogDescription, fallbackDescription),
      searchIntent: this.text(parsed.searchIntent, 'commercial investigation'),
      seoScore: this.toSeoScore(parsed.seoScore),
      structuredData: this.createStructuredData(input),
    }
  }

  private parse(raw: string): Record<string, unknown> {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim()
    return JSON.parse(cleaned) as Record<string, unknown>
  }

  private text(value: unknown, fallback = ''): string {
    return String(value || fallback).trim()
  }

  private toSeoScore(value: unknown): number {
    const score = Number(value)
    return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 85
  }

  private createStructuredData(input: BookSeoAiInput): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: input.title,
      ...(input.author ? { author: { '@type': 'Person', name: input.author } } : {}),
      ...(input.publisher ? { publisher: { '@type': 'Organization', name: input.publisher } } : {}),
      offers: {
        '@type': 'Offer',
        price: input.priceVnd,
        priceCurrency: 'VND',
      },
    }
  }
}
