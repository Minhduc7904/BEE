import { AchievementBoardEntity, AchievementRowEntity } from '../entities'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface CreateAchievementBoardData {
  title: string
  slug: string
  competitionName: string
  academicYear?: string | null
  description?: string | null
  shortDescription?: string | null
  targetKeyword?: string | null
  keywordText?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  searchIntent?: string | null
  seoScore?: number | null
  visibility?: Visibility
  isFeatured?: boolean
  sortOrder?: number
  createdBy?: number | null
  updatedBy?: number | null
}

export interface UpdateAchievementBoardData extends Partial<CreateAchievementBoardData> {}

export interface CreateAchievementRowData {
  achievementBoardId: number
  studentName: string
  schoolName?: string | null
  grade?: number | null
  score?: number | null
  sortOrder?: number
}

export interface UpdateAchievementRowData {
  studentName?: string
  schoolName?: string | null
  grade?: number | null
  score?: number | null
  sortOrder?: number
}

export interface AchievementBoardListOptions {
  skip: number
  take: number
  sortBy: string
  sortOrder: SortOrder
  search?: string
  visibility?: Visibility
  isFeatured?: boolean
  includeRows?: boolean
}

export interface IAchievementBoardRepository {
  create(data: CreateAchievementBoardData): Promise<AchievementBoardEntity>
  findById(achievementBoardId: number, includeRows?: boolean): Promise<AchievementBoardEntity | null>
  findBySlug(slug: string, includeRows?: boolean): Promise<AchievementBoardEntity | null>
  findAllWithPagination(options: AchievementBoardListOptions): Promise<{
    data: AchievementBoardEntity[]
    total: number
  }>
  update(achievementBoardId: number, data: UpdateAchievementBoardData): Promise<AchievementBoardEntity>
  delete(achievementBoardId: number): Promise<void>
  incrementViewCount(achievementBoardId: number): Promise<AchievementBoardEntity>
  createRows(data: CreateAchievementRowData[]): Promise<AchievementRowEntity[]>
  findRowById(achievementRowId: number): Promise<AchievementRowEntity | null>
  updateRow(achievementRowId: number, data: UpdateAchievementRowData): Promise<AchievementRowEntity>
  deleteRow(achievementRowId: number): Promise<void>
}
