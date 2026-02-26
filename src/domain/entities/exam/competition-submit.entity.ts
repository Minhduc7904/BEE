// src/domain/entities/exam/competition-submit.entity.ts

import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { Competition } from './competition.entity'
import { Student } from '../user/student.entity'
import { CompetitionAnswer } from './competition-answer.entity'

export class CompetitionSubmit {
    // Required properties
    competitionSubmitId: number
    competitionId: number
    studentId: number
    attemptNumber: number
    status: CompetitionSubmitStatus
    startedAt: Date
    createdAt: Date
    updatedAt: Date

    // Optional properties
    submittedAt?: Date | null
    gradedAt?: Date | null
    totalPoints?: number | null // Decimal trong DB, number trong TS
    maxPoints?: number | null
    timeSpentSeconds?: number | null
    metadata?: any // JSON metadata

    // Navigation properties
    competition?: Competition | null
    student?: Student | null
    competitionAnswers?: CompetitionAnswer[]

    constructor(data: {
        competitionSubmitId: number
        competitionId: number
        studentId: number
        attemptNumber: number
        status: CompetitionSubmitStatus
        startedAt: Date
        createdAt: Date
        updatedAt: Date
        submittedAt?: Date | null
        gradedAt?: Date | null
        totalPoints?: number | null
        maxPoints?: number | null
        timeSpentSeconds?: number | null
        metadata?: any
        competition?: Competition | null | undefined
        student?: Student | null | undefined
        competitionAnswers?: CompetitionAnswer[]
    }) {
        this.competitionSubmitId = data.competitionSubmitId
        this.competitionId = data.competitionId
        this.studentId = data.studentId
        this.attemptNumber = data.attemptNumber
        this.status = data.status
        this.startedAt = data.startedAt
        this.createdAt = data.createdAt
        this.updatedAt = data.updatedAt
        this.submittedAt = data.submittedAt
        this.gradedAt = data.gradedAt
        this.totalPoints = data.totalPoints
        this.maxPoints = data.maxPoints
        this.timeSpentSeconds = data.timeSpentSeconds
        this.metadata = data.metadata
        this.competition = data.competition
        this.student = data.student
        this.competitionAnswers = data.competitionAnswers
    }

    /* ===================== STATUS CHECK METHODS ===================== */

    isInProgress(): boolean {
        return this.status === CompetitionSubmitStatus.IN_PROGRESS
    }

    isSubmitted(): boolean {
        return this.status === CompetitionSubmitStatus.SUBMITTED
    }

    isGraded(): boolean {
        return this.status === CompetitionSubmitStatus.GRADED
    }

    isAbandoned(): boolean {
        return this.status === CompetitionSubmitStatus.ABANDONED
    }

    canSubmit(): boolean {
        return this.status === CompetitionSubmitStatus.IN_PROGRESS
    }

    canGrade(): boolean {
        return this.status === CompetitionSubmitStatus.SUBMITTED
    }

    /* ===================== BUSINESS LOGIC METHODS ===================== */

    hasBeenSubmitted(): boolean {
        return this.submittedAt !== null && this.submittedAt !== undefined
    }

    hasBeenGraded(): boolean {
        return this.gradedAt !== null && this.gradedAt !== undefined
    }

    hasScore(): boolean {
        return this.totalPoints !== null && this.totalPoints !== undefined
    }

    getScore(): number {
        return this.totalPoints ?? 0
    }

    getMaxScore(): number {
        return this.maxPoints ?? 0
    }

    getScorePercentage(): number {
        if (!this.hasScore() || !this.maxPoints || this.maxPoints === 0) {
            return 0
        }
        // After null checks, maxPoints is guaranteed to be a number
        return ((this.totalPoints ?? 0) / this.maxPoints) * 100
    }

    hasAnswers(): boolean {
        return (this.competitionAnswers?.length ?? 0) > 0
    }

    getAnswerCount(): number {
        return this.competitionAnswers?.length ?? 0
    }

    getTimeSpentMinutes(): number {
        if (!this.timeSpentSeconds) return 0
        return Math.floor(this.timeSpentSeconds / 60)
    }

    getTimeSpentDisplay(): string {
        if (!this.timeSpentSeconds) return '0 phút'
        const minutes = Math.floor(this.timeSpentSeconds / 60)
        const seconds = this.timeSpentSeconds % 60
        return `${minutes} phút ${seconds} giây`
    }

    /**
     * Tính thời gian làm bài từ startedAt đến submittedAt
     */
    calculateActualTimeSpent(): number | null {
        if (!this.submittedAt) return null
        const diff = this.submittedAt.getTime() - this.startedAt.getTime()
        return Math.floor(diff / 1000) // seconds
    }

    /**
     * Kiểm tra có quá thời gian cho phép không
     */
    isOverTime(durationMinutes: number | null): boolean {
        if (!durationMinutes || !this.timeSpentSeconds) return false
        const allowedSeconds = durationMinutes * 60
        return this.timeSpentSeconds > allowedSeconds
    }

    /* ===================== SERIALIZATION ===================== */

    toJSON() {
        return {
            competitionSubmitId: this.competitionSubmitId,
            competitionId: this.competitionId,
            studentId: this.studentId,
            attemptNumber: this.attemptNumber,
            status: this.status,
            startedAt: this.startedAt,
            submittedAt: this.submittedAt,
            gradedAt: this.gradedAt,
            totalPoints: this.totalPoints,
            maxPoints: this.maxPoints,
            timeSpentSeconds: this.timeSpentSeconds,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    equals(other: CompetitionSubmit): boolean {
        return this.competitionSubmitId === other.competitionSubmitId
    }

    clone(): CompetitionSubmit {
        return new CompetitionSubmit({
            competitionSubmitId: this.competitionSubmitId,
            competitionId: this.competitionId,
            studentId: this.studentId,
            attemptNumber: this.attemptNumber,
            status: this.status,
            startedAt: this.startedAt,
            submittedAt: this.submittedAt,
            gradedAt: this.gradedAt,
            totalPoints: this.totalPoints,
            maxPoints: this.maxPoints,
            timeSpentSeconds: this.timeSpentSeconds,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            competition: this.competition,
            student: this.student,
            competitionAnswers: this.competitionAnswers,
        })
    }
}
