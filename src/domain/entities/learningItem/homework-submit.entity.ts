// src/domain/entities/learningItem/homework-submit.entity.ts

import { HomeworkContent } from './homework-content.entity'
import { Student } from '../user/student.entity'
import { Admin } from '../user/admin.entity'
import { CompetitionSubmit } from '../exam/competition-submit.entity'

export class HomeworkSubmit {
    // Required properties
    homeworkSubmitId: number
    homeworkContentId: number
    studentId: number
    submitAt: Date
    content: string
    createdAt: Date
    updatedAt: Date

    // Optional properties
    competitionSubmitId?: number | null
    points?: number | null
    gradedAt?: Date | null
    graderId?: number | null
    feedback?: string | null

    // Navigation properties
    homeworkContent?: HomeworkContent
    student?: Student
    grader?: Admin | null
    competitionSubmit?: CompetitionSubmit | null

    constructor(data: {
        homeworkSubmitId: number
        homeworkContentId: number
        studentId: number
        content: string
        submitAt?: Date
        createdAt?: Date
        updatedAt?: Date
        competitionSubmitId?: number | null
        points?: number | null
        gradedAt?: Date | null
        graderId?: number | null
        feedback?: string | null
        homeworkContent?: HomeworkContent
        student?: Student
        grader?: Admin | null
        competitionSubmit?: CompetitionSubmit | null
    }) {
        this.homeworkSubmitId = data.homeworkSubmitId
        this.homeworkContentId = data.homeworkContentId
        this.studentId = data.studentId
        this.content = data.content
        this.submitAt = data.submitAt || new Date()
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.competitionSubmitId = data.competitionSubmitId
        this.points = data.points
        this.gradedAt = data.gradedAt
        this.graderId = data.graderId
        this.feedback = data.feedback

        this.homeworkContent = data.homeworkContent
        this.student = data.student
        this.grader = data.grader
        this.competitionSubmit = data.competitionSubmit
    }

    /* ===================== BUSINESS METHODS ===================== */

    /**
     * Đã được chấm điểm chưa
     */
    isGraded(): boolean {
        return this.points !== null && this.points !== undefined
    }

    /**
     * Có feedback không
     */
    hasFeedback(): boolean {
        return Boolean(this.feedback && this.feedback.trim().length > 0)
    }

    /**
     * Có thể chấm điểm không
     */
    canBeGraded(): boolean {
        return this.homeworkSubmitId > 0
    }

    /**
     * Chấm điểm bài làm
     */
    grade(points: number, graderId?: number, feedback?: string): void {
        this.points = points
        this.gradedAt = new Date()
        this.updatedAt = new Date()

        if (graderId !== undefined) {
            this.graderId = graderId
        }

        if (feedback !== undefined) {
            this.feedback = feedback
        }
    }

    /**
     * Cập nhật nội dung bài nộp (nếu cho phép nộp lại)
     */
    updateContent(content: string): void {
        this.content = content
        this.submitAt = new Date()
        this.updatedAt = new Date()
    }

    /**
     * Lấy tên người chấm
     */
    getGraderName(): string {
        if (!this.grader?.user) return 'Chưa chấm'
        const { firstName, lastName } = this.grader.user
        return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Chưa chấm'
    }

    /**
     * Kiểm tra bài nộp có đúng hạn không
     */
    isLate(): boolean {
        if (!this.homeworkContent?.dueDate) return false
        return this.submitAt > this.homeworkContent.dueDate
    }

    equals(other: HomeworkSubmit): boolean {
        return this.homeworkSubmitId === other.homeworkSubmitId
    }

    toJSON() {
        return {
            homeworkSubmitId: this.homeworkSubmitId,
            homeworkContentId: this.homeworkContentId,
            studentId: this.studentId,
            competitionSubmitId: this.competitionSubmitId,
            submitAt: this.submitAt,
            content: this.content,
            points: this.points,
            gradedAt: this.gradedAt,
            graderId: this.graderId,
            feedback: this.feedback,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): HomeworkSubmit {
        return new HomeworkSubmit({
            homeworkSubmitId: this.homeworkSubmitId,
            homeworkContentId: this.homeworkContentId,
            studentId: this.studentId,
            content: this.content,
            submitAt: this.submitAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            competitionSubmitId: this.competitionSubmitId,
            points: this.points,
            gradedAt: this.gradedAt,
            graderId: this.graderId,
            feedback: this.feedback,
            homeworkContent: this.homeworkContent,
            student: this.student,
            grader: this.grader,
            competitionSubmit: this.competitionSubmit,
        })
    }
}
