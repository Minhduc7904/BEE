// src/application/use-cases/question/regenerate-question-slugs.use-case.ts
import { Inject, Injectable, Logger } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

interface RegenerateQuestionSlugResultItem {
  questionId: number
  oldSlug: string
  slug?: string
  status: 'updated' | 'skipped'
  reason?: string
}

interface RegenerateQuestionSlugsResponse {
  totalCandidates: number
  updatedCount: number
  skippedCount: number
  results: RegenerateQuestionSlugResultItem[]
}

@Injectable()
export class RegenerateQuestionSlugsUseCase {
  private readonly logger = new Logger(RegenerateQuestionSlugsUseCase.name)

  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(): Promise<BaseResponseDto<RegenerateQuestionSlugsResponse>> {
    const candidates = await this.questionRepository.findSlugPatternCandidates('question-')
    const pattern = /^question-\d+$/
    const filteredCandidates = candidates.filter((item) => pattern.test(item.slug))

    const results: RegenerateQuestionSlugResultItem[] = []
    const reserved = new Set<string>()

    for (const question of filteredCandidates) {
      const searchableContent = TextSearchUtil.stripMarkdownForSearch(question.content || '')
      const contentPreview = searchableContent.substring(0, 100)
      const baseSlug = TextSearchUtil.generateSlug(contentPreview)

      if (!baseSlug) {
        results.push({
          questionId: question.questionId,
          oldSlug: question.slug,
          status: 'skipped',
          reason: 'Empty content',
        })
        continue
      }

      if (baseSlug === question.slug) {
        results.push({
          questionId: question.questionId,
          oldSlug: question.slug,
          slug: baseSlug,
          status: 'skipped',
          reason: 'Slug already matches content',
        })
        continue
      }

      try {
        const slug = await this.generateUniqueSlug(baseSlug, reserved, question.questionId)
        await this.questionRepository.update(question.questionId, { slug })

        results.push({
          questionId: question.questionId,
          oldSlug: question.slug,
          slug,
          status: 'updated',
        })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error(`Failed to update slug for questionId=${question.questionId}: ${reason}`)

        results.push({
          questionId: question.questionId,
          oldSlug: question.slug,
          status: 'skipped',
          reason,
        })
      }
    }

    const updatedCount = results.filter((item) => item.status === 'updated').length
    const skippedCount = results.length - updatedCount

    return BaseResponseDto.success('Cap nhat slug cho question thanh cong', {
      totalCandidates: filteredCandidates.length,
      updatedCount,
      skippedCount,
      results,
    })
  }

  private async generateUniqueSlug(
    baseSlug: string,
    reserved: Set<string>,
    excludeQuestionId: number,
  ): Promise<string> {
    let candidate = baseSlug
    let counter = 2

    while (true) {
      if (!reserved.has(candidate)) {
        const exists = await this.questionRepository.existsBySlug(candidate, excludeQuestionId)
        if (!exists) {
          reserved.add(candidate)
          return candidate
        }
      }

      candidate = `${baseSlug}-${counter++}`
    }
  }
}
