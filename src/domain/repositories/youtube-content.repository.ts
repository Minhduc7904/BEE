// src/domain/repositories/youtube-content.repository.ts
import { YoutubeContent } from '../entities'
import {
    CreateYoutubeContentData,
    UpdateYoutubeContentData,
    YoutubeContentFilterOptions,
    YoutubeContentPaginationOptions,
    YoutubeContentListResult,
} from '../interface/youtubeContent/youtube-content.interface'

export interface IYoutubeContentRepository {
    create(data: CreateYoutubeContentData): Promise<YoutubeContent>
    findById(id: number): Promise<YoutubeContent | null>
    update(id: number, data: UpdateYoutubeContentData): Promise<YoutubeContent>
    delete(id: number): Promise<boolean>
    findAll(): Promise<YoutubeContent[]>

    // Pagination methods
    findAllWithPagination(
        pagination: YoutubeContentPaginationOptions,
        filters?: YoutubeContentFilterOptions,
    ): Promise<YoutubeContentListResult>

    // Search methods
    searchYoutubeContents(searchTerm: string, pagination?: YoutubeContentPaginationOptions): Promise<YoutubeContentListResult>

    // Filter methods
    findByFilters(filters: YoutubeContentFilterOptions, pagination?: YoutubeContentPaginationOptions): Promise<YoutubeContentListResult>
    findByLearningItem(learningItemId: number): Promise<YoutubeContent[]>

    // Count methods
    count(filters?: YoutubeContentFilterOptions): Promise<number>
    countByLearningItem(learningItemId: number): Promise<number>
}
