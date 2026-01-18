// src/domain/entities/learningItem/homework-content.entity.ts

import { LearningItem } from './learning-item.entity'
import { Competition } from '../exam/competition.entity'
import { HomeworkSubmit } from './homework-submit.entity'

export class HomeworkContent {
    // Required properties
    homeworkContentId: number
    learningItemId: number
    content: string
    allowLateSubmit: boolean
    createdAt: Date
    updatedAt: Date

    // Optional properties
    dueDate?: Date | null
    competitionId?: number | null

    // Navigation properties
    learningItem?: LearningItem
    competition?: Competition | null
    homeworkSubmits?: HomeworkSubmit[]

    constructor(data: {
        homeworkContentId: number
        learningItemId: number
        content: string
        allowLateSubmit: boolean
        createdAt?: Date
        updatedAt?: Date
        dueDate?: Date | null
        competitionId?: number | null
        learningItem?: LearningItem
        competition?: Competition | null
        homeworkSubmits?: HomeworkSubmit[]
    }) {
        this.homeworkContentId = data.homeworkContentId
        this.learningItemId = data.learningItemId
        this.content = data.content
        this.allowLateSubmit = data.allowLateSubmit
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.dueDate = data.dueDate
        this.competitionId = data.competitionId
        this.learningItem = data.learningItem
        this.competition = data.competition
        this.homeworkSubmits = data.homeworkSubmits
    }

    /* ===================== BUSINESS METHODS ===================== */

    hasDueDate(): boolean {
        return this.dueDate !== null && this.dueDate !== undefined
    }

    isOverdue(at: Date = new Date()): boolean {
        if (!this.hasDueDate()) return false
        return this.dueDate! < at
    }

    canSubmit(at: Date = new Date()): boolean {
        if (!this.hasDueDate()) return true
        if (this.allowLateSubmit) return true
        return this.dueDate! >= at
    }

    hasCompetition(): boolean {
        return this.competitionId !== null && this.competitionId !== undefined
    }

    hasSubmissions(): boolean {
        return (this.homeworkSubmits?.length ?? 0) > 0
    }

    getSubmissionCount(): number {
        return this.homeworkSubmits?.length ?? 0
    }

    /**
     * Lấy deadline hiển thị
     */
    getDueDateDisplay(): string | null {
        if (!this.dueDate) return null
        return this.dueDate.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    equals(other: HomeworkContent): boolean {
        return this.homeworkContentId === other.homeworkContentId
    }

    toJSON() {
        return {
            homeworkContentId: this.homeworkContentId,
            learningItemId: this.learningItemId,
            content: this.content,
            dueDate: this.dueDate,
            competitionId: this.competitionId,
            allowLateSubmit: this.allowLateSubmit,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): HomeworkContent {
        return new HomeworkContent({
            homeworkContentId: this.homeworkContentId,
            learningItemId: this.learningItemId,
            content: this.content,
            allowLateSubmit: this.allowLateSubmit,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            dueDate: this.dueDate,
            competitionId: this.competitionId,
            learningItem: this.learningItem,
            competition: this.competition,
            homeworkSubmits: this.homeworkSubmits,
        })
    }
}
