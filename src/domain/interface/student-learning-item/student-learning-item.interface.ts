// src/domain/interface/student-learning-item/student-learning-item.interface.ts
import { StudentLearningItem } from '../../entities'

export interface CreateStudentLearningItemData {
    studentId: number
    learningItemId: number
    isLearned?: boolean
    learnedAt?: Date | null
}

export interface UpdateStudentLearningItemData {
    isLearned?: boolean
    learnedAt?: Date | null
}

export interface StudentLearningItemFilterOptions {
    studentId?: number
    learningItemId?: number
    isLearned?: boolean
    learningItemIds?: number[]
}

export interface StudentLearningItemPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface StudentLearningItemListResult {
    data: StudentLearningItem[]
    total: number
}
