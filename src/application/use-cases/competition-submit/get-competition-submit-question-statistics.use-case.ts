import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import type { ICompetitionAnswerRepository } from '../../../domain/repositories/competition-answer.repository'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { DifficultyLabels, QuestionTypeLabels } from '../../../shared/enums'

export type AnswerBucket = 'correct' | 'incorrect' | 'unanswered'

export interface StatsCounter {
    total: number
    correct: number
    incorrect: number
    unanswered: number
    ungraded: number
}

export interface QuestionInSubmitStats {
    questionId: number
    sectionId: number | null
    sectionTitle: string
    chapters: { chapterId: number; chapterName: string }[]
    difficulty: string
    questionType: string
    status: AnswerBucket
}

export interface GroupedStatsItem {
    key: string
    label: string
    counts: StatsCounter
}

export interface CompetitionSubmitQuestionStatisticsData {
    competitionSubmitId: number
    competitionId: number
    examId: number
    studentId: number
    totalPoints: number
    maxPoints: number
    scorePercentage: number
    totals: StatsCounter
    bySection: GroupedStatsItem[]
    byChapter: GroupedStatsItem[]
    byDifficulty: GroupedStatsItem[]
    byQuestionType: GroupedStatsItem[]
    questions: QuestionInSubmitStats[]
}

@Injectable()
export class GetCompetitionSubmitQuestionStatisticsUseCase {
    private static readonly NO_SECTION_KEY = 'NO_SECTION'
    private static readonly NO_SECTION_LABEL = 'Không thuộc section'
    private static readonly NO_CHAPTER_KEY = 'NO_CHAPTER'
    private static readonly NO_CHAPTER_LABEL = 'Không có chapter'
    private static readonly NO_DIFFICULTY_KEY = 'NO_DIFFICULTY'
    private static readonly NO_DIFFICULTY_LABEL = 'Chưa phân loại độ khó'

    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('ICompetitionAnswerRepository')
        private readonly competitionAnswerRepository: ICompetitionAnswerRepository,
    ) { }

    async execute(competitionSubmitId: number): Promise<BaseResponseDto<CompetitionSubmitQuestionStatisticsData>> {
        const submit = await this.competitionSubmitRepository.findById(competitionSubmitId)
        if (!submit) {
            throw new NotFoundException(`Lần làm bài với ID ${competitionSubmitId} không tồn tại`)
        }

        const competition = await this.competitionRepository.findById(submit.competitionId)
        if (!competition) {
            throw new NotFoundException('Cuộc thi không tồn tại')
        }
        if (!competition.examId) {
            throw new NotFoundException('Cuộc thi này không có đề thi')
        }

        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)
        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        const answers = await this.competitionAnswerRepository.findByCompetitionSubmit(competitionSubmitId)
        const answerMap = new Map(answers.map((a) => [a.questionId, a]))

        const sectionStats = new Map<string, GroupedStatsItem>()
        const chapterStats = new Map<string, GroupedStatsItem>()
        const difficultyStats = new Map<string, GroupedStatsItem>()
        const questionTypeStats = new Map<string, GroupedStatsItem>()
        const totals = this.createEmptyCounter()
        const questions: QuestionInSubmitStats[] = []

        const processQuestion = (qe: any, fallbackSectionId: number | null, fallbackSectionTitle: string) => {
            const question = qe?.question
            if (!question) return

            const sectionId = qe?.sectionId ?? fallbackSectionId
            const sectionTitle = fallbackSectionTitle
            const chapters = (question.questionChapters ?? []).map((qc: any) => ({
                chapterId: qc.chapterId,
                chapterName: qc.chapter?.name || `Chapter #${qc.chapterId}`,
            }))

            const difficultyKey = question.difficulty || GetCompetitionSubmitQuestionStatisticsUseCase.NO_DIFFICULTY_KEY
            const difficultyLabel = question.difficulty
                ? (DifficultyLabels as Record<string, string>)[question.difficulty] || question.difficulty
                : GetCompetitionSubmitQuestionStatisticsUseCase.NO_DIFFICULTY_LABEL

            const questionTypeKey = question.type
            const questionTypeLabel =
                (QuestionTypeLabels as Record<string, string>)[question.type] || question.type

            const answer = answerMap.get(question.questionId)
            const status = this.resolveAnswerStatus(answer)

            this.incrementCounter(totals, status, answer)

            const sectionKey = sectionId != null
                ? `SECTION_${sectionId}`
                : GetCompetitionSubmitQuestionStatisticsUseCase.NO_SECTION_KEY
            const sectionLabel = sectionId != null
                ? sectionTitle
                : GetCompetitionSubmitQuestionStatisticsUseCase.NO_SECTION_LABEL
            this.incrementGrouped(sectionStats, sectionKey, sectionLabel, status, answer)

            if (chapters.length > 0) {
                for (const chapter of chapters) {
                    this.incrementGrouped(
                        chapterStats,
                        `CHAPTER_${chapter.chapterId}`,
                        chapter.chapterName,
                        status,
                        answer,
                    )
                }
            } else {
                this.incrementGrouped(
                    chapterStats,
                    GetCompetitionSubmitQuestionStatisticsUseCase.NO_CHAPTER_KEY,
                    GetCompetitionSubmitQuestionStatisticsUseCase.NO_CHAPTER_LABEL,
                    status,
                    answer,
                )
            }

            this.incrementGrouped(difficultyStats, difficultyKey, difficultyLabel, status, answer)
            this.incrementGrouped(questionTypeStats, questionTypeKey, questionTypeLabel, status, answer)

            questions.push({
                questionId: question.questionId,
                sectionId,
                sectionTitle,
                chapters,
                difficulty: difficultyLabel,
                questionType: questionTypeLabel,
                status,
            })
        }

        for (const section of exam.sections ?? []) {
            const sectionTitle = section.title || `Section #${section.sectionId}`
            for (const qe of section.questions ?? []) {
                processQuestion(qe, section.sectionId, sectionTitle)
            }
        }

        for (const qe of exam.questions ?? []) {
            if (qe.sectionId) continue
            processQuestion(
                qe,
                null,
                GetCompetitionSubmitQuestionStatisticsUseCase.NO_SECTION_LABEL,
            )
        }

        const totalPointsFromAnswers = answers.reduce((sum, answer) => sum + Number(answer.points ?? 0), 0)
        const maxPointsFromAnswers = answers.reduce((sum, answer) => sum + Number(answer.maxPoints ?? 0), 0)
        const totalPoints = submit.totalPoints != null ? Number(submit.totalPoints) : totalPointsFromAnswers
        const maxPoints = submit.maxPoints != null ? Number(submit.maxPoints) : maxPointsFromAnswers
        const scorePercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 10000) / 100 : 0

        const data: CompetitionSubmitQuestionStatisticsData = {
            competitionSubmitId,
            competitionId: competition.competitionId,
            examId: exam.examId,
            studentId: submit.studentId,
            totalPoints,
            maxPoints,
            scorePercentage,
            totals,
            bySection: this.toSortedArray(sectionStats),
            byChapter: this.toSortedArray(chapterStats),
            byDifficulty: this.toSortedArray(difficultyStats),
            byQuestionType: this.toSortedArray(questionTypeStats),
            questions,
        }

        return BaseResponseDto.success('Lấy thống kê bài làm theo nhóm thành công', data)
    }

    private createEmptyCounter(): StatsCounter {
        return {
            total: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            ungraded: 0,
        }
    }

    private resolveAnswerStatus(answer: any): AnswerBucket {
        if (!answer) {
            return 'unanswered'
        }

        const hasTextAnswer = Boolean(answer.answer && String(answer.answer).trim().length > 0)
        const hasSelectedStatements = Boolean(answer.selectedStatementIds && answer.selectedStatementIds.length > 0)
        const hasAnyAnswer = hasTextAnswer || hasSelectedStatements

        if (!hasAnyAnswer) {
            return 'unanswered'
        }

        if (answer.isCorrect === true) {
            return 'correct'
        }

        return 'incorrect'
    }

    private incrementCounter(counter: StatsCounter, status: AnswerBucket, answer?: any): void {
        counter.total += 1
        counter[status] += 1
        if (status === 'incorrect' && answer?.isCorrect == null) {
            counter.ungraded += 1
        }
    }

    private incrementGrouped(
        map: Map<string, GroupedStatsItem>,
        key: string,
        label: string,
        status: AnswerBucket,
        answer?: any,
    ): void {
        const existing = map.get(key)
        const item = existing || {
            key,
            label,
            counts: this.createEmptyCounter(),
        }

        this.incrementCounter(item.counts, status, answer)
        if (!existing) {
            map.set(key, item)
        }
    }

    private toSortedArray(map: Map<string, GroupedStatsItem>): GroupedStatsItem[] {
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi'))
    }
}