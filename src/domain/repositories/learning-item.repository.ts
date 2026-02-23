// src/domain/repositories/learning-item.repository.ts
import { LearningItem } from '../entities'
import {
    CreateLearningItemData,
    UpdateLearningItemData,
    LearningItemFilterOptions,
    LearningItemPaginationOptions,
    LearningItemListResult,
} from '../interface/learningItem/learning-item.interface'
import { LearningItemType } from '../../shared/enums'

export interface ILearningItemRepository {
    create(data: CreateLearningItemData): Promise<LearningItem>
    findById(id: number): Promise<LearningItem | null>
    findByIdWithContents(id: number): Promise<LearningItem | null>
    update(id: number, data: UpdateLearningItemData): Promise<LearningItem>
    delete(id: number): Promise<boolean>
    findAll(): Promise<LearningItem[]>

    // Pagination methods
    findAllWithPagination(
        pagination: LearningItemPaginationOptions,
        filters?: LearningItemFilterOptions,
    ): Promise<LearningItemListResult>

    // Search methods
    searchLearningItems(searchTerm: string, pagination?: LearningItemPaginationOptions): Promise<LearningItemListResult>

    // Filter methods
    findByFilters(filters: LearningItemFilterOptions, pagination?: LearningItemPaginationOptions): Promise<LearningItemListResult>
    findByType(type: LearningItemType): Promise<LearningItem[]>
    findByCreator(createdBy: number): Promise<LearningItem[]>
    findByCompetition(competitionId: number): Promise<LearningItem[]>

    // Count methods
    count(filters?: LearningItemFilterOptions): Promise<number>
    countByType(type: LearningItemType): Promise<number>
    countByCreator(createdBy: number): Promise<number>
}
