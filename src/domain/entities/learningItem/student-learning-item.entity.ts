// src/domain/entities/learningItem/student-learning-item.entity.ts

import { Student } from '../user/student.entity'
import { LearningItem } from './learning-item.entity'

export class StudentLearningItem {
    // Composite key
    studentId: number
    learningItemId: number

    // State properties
    isLearned: boolean
    learnedAt?: Date | null
    createdAt: Date
    updatedAt: Date

    // Navigation properties
    student?: Student
    learningItem?: LearningItem

    constructor(data: {
        studentId: number
        learningItemId: number
        isLearned: boolean
        createdAt?: Date
        updatedAt?: Date
        learnedAt?: Date | null
        student?: Student
        learningItem?: LearningItem
    }) {
        this.studentId = data.studentId
        this.learningItemId = data.learningItemId
        this.isLearned = data.isLearned
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()
        this.learnedAt = data.learnedAt
        this.student = data.student
        this.learningItem = data.learningItem
    }

    /* ===================== DOMAIN METHODS ===================== */

    /**
     * Đã học xong chưa
     */
    hasLearned(): boolean {
        return this.isLearned === true
    }

    /**
     * Đánh dấu đã học xong
     */
    markLearned(at: Date = new Date()): void {
        this.isLearned = true
        this.learnedAt = at
        this.updatedAt = new Date()
    }

    /**
     * Reset trạng thái học (khi học lại)
     */
    resetProgress(): void {
        this.isLearned = false
        this.learnedAt = null
        this.updatedAt = new Date()
    }

    /**
     * Lấy thời gian học (ms) từ lúc tạo tới lúc hoàn thành
     */
    getLearningDuration(): number | null {
        if (!this.learnedAt) return null
        return this.learnedAt.getTime() - this.createdAt.getTime()
    }

    equals(other: StudentLearningItem): boolean {
        return (
            this.studentId === other.studentId &&
            this.learningItemId === other.learningItemId
        )
    }

    toJSON() {
        return {
            studentId: this.studentId,
            learningItemId: this.learningItemId,
            isLearned: this.isLearned,
            learnedAt: this.learnedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): StudentLearningItem {
        return new StudentLearningItem({
            studentId: this.studentId,
            learningItemId: this.learningItemId,
            isLearned: this.isLearned,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            learnedAt: this.learnedAt,
            student: this.student,
            learningItem: this.learningItem,
        })
    }
}
