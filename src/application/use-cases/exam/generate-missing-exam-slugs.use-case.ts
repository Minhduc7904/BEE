import { Inject, Injectable, Logger } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

interface GenerateExamSlugResultItem {
  examId: number
  title: string
  slug?: string
  status: 'updated' | 'skipped'
  reason?: string
}

interface GenerateMissingExamSlugsResponse {
  totalCandidates: number
  updatedCount: number
  skippedCount: number
  results: GenerateExamSlugResultItem[]
}

@Injectable()
export class GenerateMissingExamSlugsUseCase {
  private readonly logger = new Logger(GenerateMissingExamSlugsUseCase.name)

  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
  ) {}

  async execute(): Promise<BaseResponseDto<GenerateMissingExamSlugsResponse>> {
    const candidates = await this.examRepository.findMissingSlugCandidates()
    const results: GenerateExamSlugResultItem[] = []
    const reserved = new Set<string>()

    for (const exam of candidates) {
      const baseSlug = TextSearchUtil.generateSlug(exam.title, null)
      const safeBaseSlug = baseSlug || `exam-${exam.examId}`

      try {
        const slug = await this.generateUniqueSlug(safeBaseSlug, reserved)
        await this.examRepository.update(exam.examId, { slug })

        results.push({
          examId: exam.examId,
          title: exam.title,
          slug,
          status: 'updated',
        })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error(`Failed to generate slug for examId=${exam.examId}: ${reason}`)

        results.push({
          examId: exam.examId,
          title: exam.title,
          status: 'skipped',
          reason,
        })
      }
    }

    const updatedCount = results.filter((item) => item.status === 'updated').length
    const skippedCount = results.length - updatedCount

    return BaseResponseDto.success('Generate slug cho exam thieu slug thanh cong', {
      totalCandidates: candidates.length,
      updatedCount,
      skippedCount,
      results,
    })
  }

  private async generateUniqueSlug(baseSlug: string, reserved: Set<string>): Promise<string> {
    let candidate = baseSlug
    let counter = 2

    while (true) {
      if (!reserved.has(candidate)) {
        const exists = await this.examRepository.existsBySlug(candidate)
        if (!exists) {
          reserved.add(candidate)
          return candidate
        }
      }

      candidate = `${baseSlug}-${counter++}`
    }
  }
}
