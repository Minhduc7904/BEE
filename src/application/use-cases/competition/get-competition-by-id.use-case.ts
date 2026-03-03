// src/application/use-cases/competition/get-competition-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionResponseDto } from '../../dtos/competition/competition.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { COMPETITION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetCompetitionByIdUseCase {
  constructor(
    @Inject('ICompetitionRepository')
    private readonly competitionRepository: ICompetitionRepository,
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) {}

  async execute(id: number, expirySeconds = 3600): Promise<BaseResponseDto<CompetitionResponseDto>> {
    const competition = await this.competitionRepository.findById(id)

    if (!competition) {
      throw new NotFoundException(`Cuộc thi với ID ${id} không tồn tại`)
    }

    const response = CompetitionResponseDto.fromEntity(competition)

    // Đếm tổng số lượt làm bài
    response.totalSubmissions = await this.competitionSubmitRepository.countByCompetition(competition.competitionId)

    // Process policies with presigned URLs if it exists
    if (response.policies) {
      const contentFields: ContentField[] = [
        { fieldName: COMPETITION_CONTENT_FIELDS.POLICIES, content: response.policies },
      ]

      const processedResults = await this.processContentUseCase.execute(
        contentFields,
        expirySeconds,
      )

      response.processedPolicies = this.processContentUseCase.getProcessedContent(
        processedResults,
        COMPETITION_CONTENT_FIELDS.POLICIES,
      ) || response.policies
    }

    return BaseResponseDto.success('Lấy thông tin cuộc thi thành công', response)
  }
}
