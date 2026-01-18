// src/domain/interface/documentContent/document-content.interface.ts
import { DocumentContent } from '../../entities'

export interface CreateDocumentContentData {
  learningItemId: number
  content: string
  orderInDocument?: number
}

export interface UpdateDocumentContentData {
  content?: string
  orderInDocument?: number
}

export interface DocumentContentFilterOptions {
  learningItemId?: number
  search?: string
}

export interface DocumentContentPaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DocumentContentSortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface DocumentContentListResult {
  documentContents: DocumentContent[]
  total: number
  page: number
  limit: number
  totalPages: number
}
