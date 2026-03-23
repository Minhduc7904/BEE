import { Inject, Injectable, Logger } from '@nestjs/common'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { CompetitionSubmitFeedbackAiService } from 'src/infrastructure/services/competition-submit-feedback-ai.service'
import { GetCompetitionSubmitQuestionStatisticsUseCase } from './get-competition-submit-question-statistics.use-case'

interface ExecuteCreateHomeworkSubmitInput {
    homeworkContentId: number
    studentId: number
    competitionId: number
    submitId: number
    competitionSubmitId?: number
    points: number
}

interface ExecuteUpdateHomeworkSubmitInput {
    homeworkSubmitId: number
    submitId: number
    competitionSubmitId?: number
    points: number
}

@Injectable()
export class HandleHomeworkSubmitByCompetitionUseCase {
    private readonly logger = new Logger(HandleHomeworkSubmitByCompetitionUseCase.name)

    constructor(
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
        private readonly getCompetitionSubmitQuestionStatisticsUseCase: GetCompetitionSubmitQuestionStatisticsUseCase,
        private readonly competitionSubmitFeedbackAiService: CompetitionSubmitFeedbackAiService,
    ) { }

    async excuteCreate(input: ExecuteCreateHomeworkSubmitInput): Promise<{ homeworkSubmitId: number; points: number; feedback?: string | null }> {
        const competitionSubmitId = input.competitionSubmitId ?? input.submitId

        const created = await this.homeworkSubmitRepository.create({
            homeworkContentId: input.homeworkContentId,
            studentId: input.studentId,
            content: `Nộp bài qua cuộc thi #${input.competitionId} (submit #${input.submitId})`,
            competitionSubmitId,
        })

        const updated = await this.homeworkSubmitRepository.update(created.homeworkSubmitId, {
            points: input.points,
        })

        const aiFeedback = await this.tryGenerateAndSaveFeedback(updated.homeworkSubmitId, competitionSubmitId)

        return {
            homeworkSubmitId: updated.homeworkSubmitId,
            points: input.points,
            feedback: aiFeedback,
        }
    }

    async excuteUpdate(input: ExecuteUpdateHomeworkSubmitInput): Promise<{ homeworkSubmitId: number; points: number; feedback?: string | null }> {
        const competitionSubmitId = input.competitionSubmitId ?? input.submitId

        const updated = await this.homeworkSubmitRepository.update(input.homeworkSubmitId, {
            points: input.points,
            competitionSubmitId,
        })

        const aiFeedback = await this.tryGenerateAndSaveFeedback(updated.homeworkSubmitId, competitionSubmitId)

        return {
            homeworkSubmitId: updated.homeworkSubmitId,
            points: input.points,
            feedback: aiFeedback,
        }
    }

    private async tryGenerateAndSaveFeedback(homeworkSubmitId: number, competitionSubmitId?: number): Promise<string | null> {
        const aiFeedback = await this.generateAiFeedback(competitionSubmitId)
        if (!aiFeedback) {
            return null
        }

        try {
            await this.homeworkSubmitRepository.update(homeworkSubmitId, {
                feedback: aiFeedback,
            })
            return aiFeedback
        } catch (error: any) {
            this.logger.warn(`Không lưu được feedback AI cho homeworkSubmitId=${homeworkSubmitId}: ${error?.message || 'Unknown error'}`)
            return null
        }
    }

    private async generateAiFeedback(competitionSubmitId?: number): Promise<string | null> {
        if (!competitionSubmitId) {
            return null
        }

        try {
            const statsResponse = await this.getCompetitionSubmitQuestionStatisticsUseCase.execute(competitionSubmitId)
            if (!statsResponse?.data) {
                return null
            }

            const feedback = await this.competitionSubmitFeedbackAiService.generateFeedbackFromStatistics(
                statsResponse.data,
            )

            return feedback || null
        } catch (error: any) {
            this.logger.warn(`Không tạo được nhận xét cho competitionSubmitId=${competitionSubmitId}: ${error?.message || 'Unknown error'}`)
            return null
        }
    }
}