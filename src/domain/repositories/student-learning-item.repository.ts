// src/domain/repositories/student-learning-item.repository.ts
import { StudentLearningItem } from '../entities'
import {
    CreateStudentLearningItemData,
    UpdateStudentLearningItemData,
    StudentLearningItemFilterOptions,
    StudentLearningItemPaginationOptions,
    StudentLearningItemListResult,
} from '../interface/student-learning-item/student-learning-item.interface'

export interface IStudentLearningItemRepository {
    // Basic CRUD
    create(data: CreateStudentLearningItemData): Promise<StudentLearningItem>
    createBulk(data: CreateStudentLearningItemData[]): Promise<StudentLearningItem[]>
    findByCompositeId(studentId: number, learningItemId: number): Promise<StudentLearningItem | null>
    update(studentId: number, learningItemId: number, data: UpdateStudentLearningItemData): Promise<StudentLearningItem>
    delete(studentId: number, learningItemId: number): Promise<boolean>
    findAll(): Promise<StudentLearningItem[]>

    // Pagination methods
    findAllWithPagination(
        pagination: StudentLearningItemPaginationOptions,
        filters?: StudentLearningItemFilterOptions,
    ): Promise<StudentLearningItemListResult>

    // Query methods
    findByStudent(studentId: number): Promise<StudentLearningItem[]>
    findByLearningItem(learningItemId: number): Promise<StudentLearningItem[]>
    findByStudentAndItems(studentId: number, learningItemIds: number[]): Promise<StudentLearningItem[]>
    findByFilters(filters: StudentLearningItemFilterOptions): Promise<StudentLearningItem[]>
    exists(studentId: number, learningItemId: number): Promise<boolean>

    // Count methods
    count(filters?: StudentLearningItemFilterOptions): Promise<number>
    countByStudent(studentId: number): Promise<number>
    countByLearningItem(learningItemId: number): Promise<number>
    countLearnedByStudent(studentId: number): Promise<number>
}
