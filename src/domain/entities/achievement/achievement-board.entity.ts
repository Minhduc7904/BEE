import { Visibility } from 'src/shared/enums'
import { AchievementRowEntity } from './achievement-row.entity'

export class AchievementBoardEntity {
  achievementBoardId: number
  title: string
  slug: string
  competitionName: string
  academicYear: string | null
  description: string | null
  shortDescription: string | null
  targetKeyword: string | null
  keywordText: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  searchIntent: string | null
  seoScore: number | null
  visibility: Visibility
  isFeatured: boolean
  viewCount: number
  sortOrder: number
  createdBy: number | null
  updatedBy: number | null
  createdAt: Date
  updatedAt: Date
  rows: AchievementRowEntity[]

  constructor(data: {
    achievementBoardId: number
    title: string
    slug: string
    competitionName: string
    academicYear: string | null
    description: string | null
    shortDescription: string | null
    targetKeyword: string | null
    keywordText: string | null
    metaTitle: string | null
    metaDescription: string | null
    ogTitle: string | null
    ogDescription: string | null
    searchIntent: string | null
    seoScore: number | null
    visibility: Visibility
    isFeatured: boolean
    viewCount: number
    sortOrder: number
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
    rows?: AchievementRowEntity[]
  }) {
    Object.assign(this, data)
    this.rows = data.rows ?? []
  }

  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }
}
