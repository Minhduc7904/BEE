import { Injectable } from '@nestjs/common'
import { OpenAIService } from './openai.service'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export interface AchievementBoardSeoFields {
  targetKeyword: string
  keywordText: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  searchIntent: string
  seoScore: number
}

export interface AchievementBoardSeoContext {
  title: string
  competitionName: string
  academicYear?: string | null
  description?: string | null
  shortDescription?: string | null
}

@Injectable()
export class AchievementBoardSeoAiService {
  constructor(private readonly openaiService: OpenAIService) {}

  async generate(context: AchievementBoardSeoContext): Promise<AchievementBoardSeoFields> {
    const compactContext = this.buildContext(context)

    const systemMessage = [
      'You are a Vietnamese SEO specialist for an education website.',
      'Generate on-page SEO metadata for an achievement board page.',
      'The page lists students and schools with competition scores or awards.',
      'Write natural Vietnamese with diacritics in the JSON values.',
      'Do not invent unverifiable awards, student names, schools, rankings, or guarantees.',
      'Do not keyword-stuff. Keep metadata useful for Google and social sharing.',
      'Return valid JSON only. No markdown. No explanation.',
    ].join('\n')

    const prompt = [
      'Generate SEO metadata for this achievement board.',
      compactContext,
      '',
      'Return exactly this JSON object shape:',
      '{',
      '  "targetKeyword": "one primary Vietnamese keyword phrase",',
      '  "keywordText": "5-10 secondary keyword phrases separated by commas",',
      '  "metaTitle": "max 60 characters, includes the primary keyword if natural",',
      '  "metaDescription": "140-160 characters, useful and natural",',
      '  "ogTitle": "social sharing title",',
      '  "ogDescription": "social sharing description",',
      '  "searchIntent": "achievement board | competition results | student awards | informational",',
      '  "seoScore": 85',
      '}',
      '',
      'seoScore must be an integer from 0 to 100 that estimates metadata completeness.',
    ].join('\n')

    const raw = await this.openaiService.generateText(prompt, systemMessage, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 700,
    })

    return this.parse(raw, context)
  }

  private buildContext(context: AchievementBoardSeoContext): string {
    const rows = [
      ['Title', context.title],
      ['Competition name', context.competitionName],
      ['Academic year', context.academicYear],
      ['Short description', context.shortDescription],
      ['Description', context.description],
    ]

    return rows
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
      .map(([label, value]) => `${label}: ${this.clean(String(value))}`)
      .join('\n')
      .slice(0, 12000)
  }

  private clean(value: string): string {
    return TextSearchUtil.stripMarkdownForSearch(value).slice(0, 2000)
  }

  private parse(raw: string, context: AchievementBoardSeoContext): AchievementBoardSeoFields {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    const fallbackKeyword = `${context.competitionName} ${context.academicYear || ''}`.trim()
    const parsedSeoScore = Number(parsed.seoScore)

    return {
      targetKeyword: String(parsed.targetKeyword || fallbackKeyword).trim(),
      keywordText: String(parsed.keywordText || '').trim(),
      metaTitle: String(parsed.metaTitle || context.title).trim(),
      metaDescription: String(parsed.metaDescription || context.shortDescription || context.description || '').trim(),
      ogTitle: String(parsed.ogTitle || context.title).trim(),
      ogDescription: String(parsed.ogDescription || context.shortDescription || context.description || '').trim(),
      searchIntent: String(parsed.searchIntent || 'achievement board').trim(),
      seoScore: Number.isFinite(parsedSeoScore) ? Math.max(0, Math.min(100, Math.round(parsedSeoScore))) : 85,
    }
  }
}
