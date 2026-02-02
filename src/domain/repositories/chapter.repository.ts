import { Chapter } from '../entities/chapter/chapter.entity'

export interface CreateChapterData {
  subjectId: number
  name: string
  code?: string
  slug: string
  parentChapterId?: number | null
  orderInParent: number
  level: number
}

export interface UpdateChapterData {
  subjectId?: number
  name?: string
  code?: string
  slug?: string
  parentChapterId?: number | null
  orderInParent?: number
  level?: number
}

export interface FindAllChaptersOptions {
  skip?: number
  take?: number
  search?: string
  subjectId?: number
  parentChapterId?: number | null
  level?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FindAllChaptersResult {
  data: Chapter[]
  total: number
}

export interface IChapterRepository {
  create(data: CreateChapterData): Promise<Chapter>
  findById(id: number): Promise<Chapter | null>
  findByIds(ids: number[]): Promise<Chapter[]>
  findBySlug(slug: string): Promise<Chapter | null>
  findBySubjectId(subjectId: number): Promise<Chapter[]>
  findByParentChapterId(parentChapterId: number | null): Promise<Chapter[]>
  findRootChapters(subjectId: number): Promise<Chapter[]>
  findAll(limit?: number, offset?: number): Promise<Chapter[]>
  findAllWithPagination(options: FindAllChaptersOptions): Promise<FindAllChaptersResult>
  update(id: number, data: UpdateChapterData): Promise<Chapter>
  delete(id: number): Promise<void>
  reorderChapters(parentChapterId: number | null, chapterIds: number[]): Promise<void>
}
