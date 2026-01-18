// src/domain/repositories/video-content.repository.ts
import { VideoContent } from '../entities'
import {
    CreateVideoContentData,
    UpdateVideoContentData,
    VideoContentFilterOptions,
    VideoContentPaginationOptions,
    VideoContentListResult,
} from '../interface/videoContent/video-content.interface'

export interface IVideoContentRepository {
    create(data: CreateVideoContentData): Promise<VideoContent>
    findById(id: number): Promise<VideoContent | null>
    update(id: number, data: UpdateVideoContentData): Promise<VideoContent>
    delete(id: number): Promise<boolean>
    findAll(): Promise<VideoContent[]>

    // Pagination methods
    findAllWithPagination(
        pagination: VideoContentPaginationOptions,
        filters?: VideoContentFilterOptions,
    ): Promise<VideoContentListResult>

    // Search methods
    searchVideoContents(searchTerm: string, pagination?: VideoContentPaginationOptions): Promise<VideoContentListResult>

    // Filter methods
    findByFilters(filters: VideoContentFilterOptions, pagination?: VideoContentPaginationOptions): Promise<VideoContentListResult>
    findByLearningItem(learningItemId: number): Promise<VideoContent[]>

    // Count methods
    count(filters?: VideoContentFilterOptions): Promise<number>
    countByLearningItem(learningItemId: number): Promise<number>
}
