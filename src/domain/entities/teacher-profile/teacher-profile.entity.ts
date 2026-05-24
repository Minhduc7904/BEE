import { Visibility } from 'src/shared/enums'

export class TeacherProfileEntity {
  teacherProfileId: number
  displayName: string
  slug: string
  headline: string | null
  shortDescription: string | null
  bio: string | null
  expertise: string | null
  teachingSubjects: string | null
  gradeLevels: string | null
  teachingFormats: string | null
  teachingMethods: string | null
  yearsExperience: number | null
  education: string | null
  certifications: string | null
  achievements: string | null
  teachingArea: string | null
  workplace: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactZalo: string | null
  contactFacebook: string | null
  contactWebsite: string | null
  contactAddress: string | null
  bookingUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
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

  constructor(data: {
    teacherProfileId: number
    displayName: string
    slug: string
    headline: string | null
    shortDescription: string | null
    bio: string | null
    expertise: string | null
    teachingSubjects: string | null
    gradeLevels: string | null
    teachingFormats: string | null
    teachingMethods: string | null
    yearsExperience: number | null
    education: string | null
    certifications: string | null
    achievements: string | null
    teachingArea: string | null
    workplace: string | null
    contactEmail: string | null
    contactPhone: string | null
    contactZalo: string | null
    contactFacebook: string | null
    contactWebsite: string | null
    contactAddress: string | null
    bookingUrl: string | null
    ctaLabel: string | null
    ctaUrl: string | null
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
  }) {
    Object.assign(this, data)
  }

  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }
}
