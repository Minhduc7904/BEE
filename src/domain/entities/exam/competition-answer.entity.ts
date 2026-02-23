// src/domain/entities/exam/competition-answer.entity.ts

import { CompetitionSubmit } from './competition-submit.entity'
import { Question } from './question.entity'

export class CompetitionAnswer {
    // Required properties
    competitionAnswerId: number
    competitionSubmitId: number
    questionId: number
    createdAt: Date
    updatedAt: Date

    // Optional properties
    answer?: string | null // Câu trả lời dạng text (SHORT_ANSWER, ESSAY)
    selectedStatementIds?: number[] | null // Array ID statements đã chọn (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE)
    isCorrect?: boolean | null // null = chưa chấm
    points?: number | null // Decimal trong DB
    maxPoints?: number | null
    timeSpentSeconds?: number | null

    // Navigation properties
    competitionSubmit?: CompetitionSubmit | null
    question?: Question | null

    constructor(data: {
        competitionAnswerId: number
        competitionSubmitId: number
        questionId: number
        createdAt: Date
        updatedAt: Date
        answer?: string | null
        selectedStatementIds?: number[] | null
        isCorrect?: boolean | null
        points?: number | null
        maxPoints?: number | null
        timeSpentSeconds?: number | null
        competitionSubmit?: CompetitionSubmit | null | undefined
        question?: Question | null | undefined
    }) {
        this.competitionAnswerId = data.competitionAnswerId
        this.competitionSubmitId = data.competitionSubmitId
        this.questionId = data.questionId
        this.createdAt = data.createdAt
        this.updatedAt = data.updatedAt
        this.answer = data.answer
        this.selectedStatementIds = data.selectedStatementIds
        this.isCorrect = data.isCorrect
        this.points = data.points
        this.maxPoints = data.maxPoints
        this.timeSpentSeconds = data.timeSpentSeconds
        this.competitionSubmit = data.competitionSubmit
        this.question = data.question
    }

    /* ===================== TYPE CHECK METHODS ===================== */

    hasTextAnswer(): boolean {
        return Boolean(this.answer && this.answer.trim().length > 0)
    }

    hasSelectedStatements(): boolean {
        return Boolean(this.selectedStatementIds && this.selectedStatementIds.length > 0)
    }

    hasAnswer(): boolean {
        return this.hasTextAnswer() || this.hasSelectedStatements()
    }

    /* ===================== GRADING METHODS ===================== */

    hasBeenGraded(): boolean {
        return this.isCorrect !== null && this.isCorrect !== undefined
    }

    hasScore(): boolean {
        return this.points !== null && this.points !== undefined
    }

    getScore(): number {
        return this.points ?? 0
    }

    getMaxScore(): number {
        return this.maxPoints ?? 0
    }

    getScorePercentage(): number {
        if (!this.hasScore() || !this.maxPoints || this.maxPoints === 0) {
            return 0
        }
        // After null checks, maxPoints is guaranteed to be a number
        return ((this.points ?? 0) / this.maxPoints) * 100
    }

    isAnswerCorrect(): boolean {
        return this.isCorrect === true
    }

    isAnswerIncorrect(): boolean {
        return this.isCorrect === false
    }

    isAnswerUngraded(): boolean {
        return this.isCorrect === null || this.isCorrect === undefined
    }

    /* ===================== TIME METHODS ===================== */

    hasTimeSpent(): boolean {
        return this.timeSpentSeconds !== null && this.timeSpentSeconds !== undefined
    }

    getTimeSpentMinutes(): number {
        if (!this.timeSpentSeconds) return 0
        return Math.floor(this.timeSpentSeconds / 60)
    }

    getTimeSpentDisplay(): string {
        if (!this.timeSpentSeconds) return '0 giây'
        if (this.timeSpentSeconds < 60) {
            return `${this.timeSpentSeconds} giây`
        }
        const minutes = Math.floor(this.timeSpentSeconds / 60)
        const seconds = this.timeSpentSeconds % 60
        if (seconds === 0) {
            return `${minutes} phút`
        }
        return `${minutes} phút ${seconds} giây`
    }

    /* ===================== SELECTED STATEMENTS METHODS ===================== */

    getSelectedStatementIds(): number[] {
        return this.selectedStatementIds ?? []
    }

    getSelectedStatementCount(): number {
        return this.getSelectedStatementIds().length
    }

    hasSelectedStatement(statementId: number): boolean {
        return this.getSelectedStatementIds().includes(statementId)
    }

    /* ===================== SERIALIZATION ===================== */

    toJSON() {
        return {
            competitionAnswerId: this.competitionAnswerId,
            competitionSubmitId: this.competitionSubmitId,
            questionId: this.questionId,
            answer: this.answer,
            selectedStatementIds: this.selectedStatementIds,
            isCorrect: this.isCorrect,
            points: this.points,
            maxPoints: this.maxPoints,
            timeSpentSeconds: this.timeSpentSeconds,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    equals(other: CompetitionAnswer): boolean {
        return this.competitionAnswerId === other.competitionAnswerId
    }

    clone(): CompetitionAnswer {
        return new CompetitionAnswer({
            competitionAnswerId: this.competitionAnswerId,
            competitionSubmitId: this.competitionSubmitId,
            questionId: this.questionId,
            answer: this.answer,
            selectedStatementIds: this.selectedStatementIds,
            isCorrect: this.isCorrect,
            points: this.points,
            maxPoints: this.maxPoints,
            timeSpentSeconds: this.timeSpentSeconds,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            competitionSubmit: this.competitionSubmit,
            question: this.question,
        })
    }
}
