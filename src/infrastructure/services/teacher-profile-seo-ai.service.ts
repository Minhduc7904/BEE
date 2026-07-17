import type { TeacherProfileSeoAiService as TeacherProfileSeoAiServicePort } from 'src/application/interfaces/teacher-profile-seo-ai.interface'
import { Injectable } from '@nestjs/common'
import { OpenAIService } from './openai.service'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export interface TeacherProfileSeoFields {
  targetKeyword: string
  keywordText: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  searchIntent: string
}

export interface TeacherProfileSeoContext {
  displayName: string
  headline?: string | null
  shortDescription?: string | null
  bio?: string | null
  expertise?: string | null
  teachingSubjects?: string | null
  gradeLevels?: string | null
  teachingFormats?: string | null
  teachingMethods?: string | null
  yearsExperience?: number | null
  education?: string | null
  certifications?: string | null
  achievements?: string | null
  teachingArea?: string | null
  workplace?: string | null
}

@Injectable()
export class TeacherProfileSeoAiService {
  constructor(private readonly openaiService: OpenAIService) {}

  async generate(context: TeacherProfileSeoContext): Promise<TeacherProfileSeoFields> {
    const compactContext = this.buildContext(context)

    const systemMessage = [
      'You are a Vietnamese SEO specialist for an education website.',
      'Generate on-page SEO metadata for a teacher profile page.',
      'Write natural Vietnamese with diacritics in the JSON values.',
      'Do not keyword-stuff. Do not invent unverifiable degrees, awards, workplace, or guarantees.',
      'Prefer search intent around finding a teacher, tutor, online class, or exam preparation when relevant.',
      'Return valid JSON only. No markdown. No explanation.',
    ].join('\n')

    const prompt = [
      'Generate SEO metadata for this teacher profile.',
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
      '  "searchIntent": "teacher profile | tutor | online class | exam prep"',
      '}',
    ].join('\n')

    const raw = await this.openaiService.generateText(prompt, systemMessage, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 700,
    })

    return this.parse(raw, context)
  }

  private buildContext(context: TeacherProfileSeoContext): string {
    const rows = [
      ['Display name', context.displayName],
      ['Headline', context.headline],
      ['Short description', context.shortDescription],
      ['Bio', context.bio],
      ['Expertise', context.expertise],
      ['Teaching subjects', context.teachingSubjects],
      ['Grade levels', context.gradeLevels],
      ['Teaching formats', context.teachingFormats],
      ['Teaching methods', context.teachingMethods],
      ['Years experience', context.yearsExperience?.toString()],
      ['Education', context.education],
      ['Certifications', context.certifications],
      ['Achievements', context.achievements],
      ['Teaching area', context.teachingArea],
      ['Workplace', context.workplace],
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

  private parse(raw: string, context: TeacherProfileSeoContext): TeacherProfileSeoFields {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    const fallbackKeyword = context.teachingSubjects
      ? `giao vien ${context.teachingSubjects.split(',')[0].trim()}`
      : `giao vien ${context.displayName}`

    return {
      targetKeyword: String(parsed.targetKeyword || fallbackKeyword).trim(),
      keywordText: String(parsed.keywordText || '').trim(),
      metaTitle: String(parsed.metaTitle || context.displayName).trim(),
      metaDescription: String(parsed.metaDescription || context.shortDescription || '').trim(),
      ogTitle: String(parsed.ogTitle || context.displayName).trim(),
      ogDescription: String(parsed.ogDescription || context.shortDescription || '').trim(),
      searchIntent: String(parsed.searchIntent || 'teacher profile').trim(),
    }
  }
}
