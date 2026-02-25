// src/application/use-cases/competition-submit/start-competition-attempt.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository, ICompetitionRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionSubmitResponseDto } from '../../dtos/competition-submit/competition-submit.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'

@Injectable()
export class StartCompetitionAttemptUseCase {
  constructor(
    @Inject('ICompetitionRepository')
    private readonly competitionRepository: ICompetitionRepository,
    @Inject('ICompetitionSubmitRepository')
    private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
  ) {}

  async execute(competitionId: number, studentId: number): Promise<BaseResponseDto<CompetitionSubmitResponseDto>> {
    // 1. Find competition
    const competition = await this.competitionRepository.findById(competitionId)

    if (!competition) {
      throw new NotFoundException(`Cuộc thi với ID ${competitionId} không tồn tại`)
    }

    // 2. Check if competition is ongoing (optional - based on startDate/endDate)
    const now = new Date()

    if (competition.startDate && now < competition.startDate) {
      return {
        success: false,
        message: `Cuộc thi chưa bắt đầu. Thời gian bắt đầu: ${competition.startDate.toISOString()}`,
        data: null as any,
      }
    }

    if (competition.endDate && now > competition.endDate) {
      return {
        success: false,
        message: `Cuộc thi đã kết thúc. Thời gian kết thúc: ${competition.endDate.toISOString()}`,
        data: null as any,
      }
    }

    // 3. Check if there's already an IN_PROGRESS attempt
    const existingAttempts = await this.competitionSubmitRepository.findByCompetitionAndStudent(
      competitionId,
      studentId,
    )

    // Find IN_PROGRESS attempt that has not exceeded durationMinutes
    const inProgressAttempt = existingAttempts.find((attempt) => {
      if (attempt.status !== CompetitionSubmitStatus.IN_PROGRESS) return false

      // Nếu không có durationMinutes thì không có giới hạn thời gian -> vẫn còn hiệu lực
      if (!competition.durationMinutes) return true

      const elapsedMs = now.getTime() - attempt.startedAt.getTime()
      const durationMs = competition.durationMinutes * 60 * 1000
      return elapsedMs < durationMs
    })

    if (inProgressAttempt) {
      // Return existing IN_PROGRESS attempt còn trong thời gian làm bài
      const dto = CompetitionSubmitResponseDto.fromEntity(inProgressAttempt)
      return BaseResponseDto.success('Bạn đang có lần làm bài chưa hoàn thành', dto)
    }

    // 4. Check maxAttempts limit
    const submittedAttempts = existingAttempts.filter(
      (attempt) =>
        attempt.status === CompetitionSubmitStatus.SUBMITTED || attempt.status === CompetitionSubmitStatus.GRADED,
    )

    if (competition.maxAttempts !== null && competition.maxAttempts !== undefined) {
      if (submittedAttempts.length >= competition.maxAttempts) {
        return {
          success: false,
          message: `Bạn đã vượt quá số lần làm bài cho phép (${competition.maxAttempts} lần)`,
          data: null as any,
        }
      }
    }

    // 5. Create new attempt
    const attemptNumber = existingAttempts.length + 1

    const newAttempt = await this.competitionSubmitRepository.create({
      competitionId,
      studentId,
      attemptNumber,
      status: CompetitionSubmitStatus.IN_PROGRESS,
      startedAt: new Date(),
      metadata: {
        startedAt: new Date().toISOString(),
        userAgent: 'web', // TODO: Get from request headers if needed
      },
    })

    // Load relations for response
    const attemptWithRelations = await this.competitionSubmitRepository.findById(newAttempt.competitionSubmitId)

    if (!attemptWithRelations) {
      throw new NotFoundException('Không thể tải thông tin lần làm bài vừa tạo')
    }

    const dto = CompetitionSubmitResponseDto.fromEntity(attemptWithRelations)
    return BaseResponseDto.success('Bắt đầu lần làm bài mới thành công', dto)
  }
}
