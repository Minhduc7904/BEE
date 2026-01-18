// src/domain/repositories/homework-content.repository.ts
import { HomeworkContent } from '../entities'
import {
    CreateHomeworkContentData,
    UpdateHomeworkContentData,
    HomeworkContentFilterOptions,
    HomeworkContentPaginationOptions,
    HomeworkContentListResult,
} from '../interface/homeworkContent/homework-content.interface'

export interface IHomeworkContentRepository {
    create(data: CreateHomeworkContentData): Promise<HomeworkContent>
    findById(id: number): Promise<HomeworkContent | null>
    update(id: number, data: UpdateHomeworkContentData): Promise<HomeworkContent>
    delete(id: number): Promise<boolean>
    findAll(): Promise<HomeworkContent[]>

    // Pagination methods
    findAllWithPagination(
        pagination: HomeworkContentPaginationOptions,
        filters?: HomeworkContentFilterOptions,
    ): Promise<HomeworkContentListResult>

    // Search methods
    searchHomeworkContents(searchTerm: string, pagination?: HomeworkContentPaginationOptions): Promise<HomeworkContentListResult>

    // Filter methods
    findByFilters(filters: HomeworkContentFilterOptions, pagination?: HomeworkContentPaginationOptions): Promise<HomeworkContentListResult>
    findByLearningItem(learningItemId: number): Promise<HomeworkContent[]>
    findByCompetition(competitionId: number): Promise<HomeworkContent[]>

    // Count methods
    count(filters?: HomeworkContentFilterOptions): Promise<number>
    countByLearningItem(learningItemId: number): Promise<number>
    countByCompetition(competitionId: number): Promise<number>
}
