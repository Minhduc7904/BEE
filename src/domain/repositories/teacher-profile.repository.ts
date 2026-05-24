import { TeacherProfileEntity } from '../entities'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface CreateTeacherProfileData {
  displayName: string
  slug: string
  headline?: string | null
  shortDescription?: string | null
  bio?: string | null
  expertise?: string | null
  teachingSubjects?: string | null
  gradeLevels?: string | null
  teachingFormats?: string | null
  teachingMethods?: string | null
  yearsExperience?: number | null
  education?: string | null
  certifications?: string | null
  achievements?: string | null
  teachingArea?: string | null
  workplace?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactZalo?: string | null
  contactFacebook?: string | null
  contactWebsite?: string | null
  contactAddress?: string | null
  bookingUrl?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
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

export interface UpdateTeacherProfileData extends Partial<CreateTeacherProfileData> {}

export interface TeacherProfileListOptions {
  skip: number
  take: number
  sortBy: string
  sortOrder: SortOrder
  search?: string
  visibility?: Visibility
  isFeatured?: boolean
}

export interface ITeacherProfileRepository {
  create(data: CreateTeacherProfileData): Promise<TeacherProfileEntity>
  findById(teacherProfileId: number): Promise<TeacherProfileEntity | null>
  findBySlug(slug: string): Promise<TeacherProfileEntity | null>
  findAllWithPagination(options: TeacherProfileListOptions): Promise<{
    data: TeacherProfileEntity[]
    total: number
  }>
  update(teacherProfileId: number, data: UpdateTeacherProfileData): Promise<TeacherProfileEntity>
  incrementViewCount(teacherProfileId: number): Promise<TeacherProfileEntity>
  delete(teacherProfileId: number): Promise<void>
}
