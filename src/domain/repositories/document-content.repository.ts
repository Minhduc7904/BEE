// src/domain/repositories/document-content.repository.ts
import { DocumentContent } from '../entities'
import {
    CreateDocumentContentData,
    UpdateDocumentContentData,
    DocumentContentFilterOptions,
    DocumentContentPaginationOptions,
    DocumentContentListResult,
} from '../interface/documentContent/document-content.interface'

export interface IDocumentContentRepository {
    create(data: CreateDocumentContentData): Promise<DocumentContent>
    findById(id: number): Promise<DocumentContent | null>
    update(id: number, data: UpdateDocumentContentData): Promise<DocumentContent>
    delete(id: number): Promise<boolean>
    findAll(): Promise<DocumentContent[]>

    // Pagination methods
    findAllWithPagination(
        pagination: DocumentContentPaginationOptions,
        filters?: DocumentContentFilterOptions,
    ): Promise<DocumentContentListResult>

    // Search methods
    searchDocumentContents(searchTerm: string, pagination?: DocumentContentPaginationOptions): Promise<DocumentContentListResult>

    // Filter methods
    findByFilters(filters: DocumentContentFilterOptions, pagination?: DocumentContentPaginationOptions): Promise<DocumentContentListResult>
    findByLearningItem(learningItemId: number): Promise<DocumentContent[]>

    // Count methods
    count(filters?: DocumentContentFilterOptions): Promise<number>
    countByLearningItem(learningItemId: number): Promise<number>

    // Order methods
    getMaxOrderByLearningItem(learningItemId: number): Promise<number>
}
