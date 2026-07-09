import { BaseResponseDto } from '../common/base-response.dto'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

export interface PublicSeoCourseTeacherDto {
  adminId: number
  userId?: number
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
}

export interface PublicSeoCourseSubjectDto {
  subjectId: number
  name: string
  code?: string
}

export interface PublicSeoCourseClassDto {
  classId: number
  className: string
  startDate?: Date | null
  endDate?: Date | null
  weeklySchedule?: string | null
  room?: string | null
}

export interface PublicSeoCourseAssistantDto {
  courseAssistantId: number
  adminId: number
  joinedAt: Date
  admin?: PublicSeoCourseTeacherDto
}

export interface PublicSeoMediaFileDto {
  usageId?: number
  mediaId: number
  fileName: string
  originalName: string
  mimeType: string
  type: string
  viewUrl?: string
  expiresAt?: Date
  expirySeconds?: number
  width?: number | null
  height?: number | null
  duration?: number | null
}

export interface PublicSeoCourseMediaDto {
  thumbnail?: PublicSeoMediaFileDto
  banner?: PublicSeoMediaFileDto
  introVideo?: PublicSeoMediaFileDto
  gallery: PublicSeoMediaFileDto[]
}

export interface PublicSeoDocumentContentDto {
  documentContentId: number
  learningItemId: number
  content: string
  orderInDocument?: number | null
  mediaFiles: PublicSeoMediaFileDto[]
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoYoutubeContentDto {
  youtubeContentId: number
  learningItemId: number
  content: string
  youtubeUrl: string
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoVideoContentDto {
  videoContentId: number
  learningItemId: number
  content: string
  mediaFiles: PublicSeoMediaFileDto[]
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoHomeworkContentDto {
  homeworkContentId: number
  learningItemId: number
  content: string
  dueDate?: Date | null
  competitionId?: number | null
  allowLateSubmit: boolean
  updatePointsOnLateSubmit: boolean
  updatePointsOnReSubmit: boolean
  updateMaxPoints: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoLearningItemDto {
  lessonId: number
  learningItemId: number
  order?: number | null
  type: string
  title: string
  description?: string | null
  homeworkContents: PublicSeoHomeworkContentDto[]
  documentContents: PublicSeoDocumentContentDto[]
  youtubeContents: PublicSeoYoutubeContentDto[]
  videoContents: PublicSeoVideoContentDto[]
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoLessonChapterDto {
  chapterId: number
  name?: string
  slug?: string
  code?: string | null
  level?: number
}

export interface PublicSeoCourseLessonDto {
  lessonId: number
  courseId: number
  title: string
  description?: string | null
  visibility: string
  orderInCourse: number
  teacherId?: number | null
  allowTrial: boolean
  chapters: PublicSeoLessonChapterDto[]
  learningItems: PublicSeoLearningItemDto[]
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoCourseSummaryDto {
  courseId: number
  code: string
  title: string
  subtitle?: string | null
  academicYear?: string | null
  grade?: number | null
  subjectId?: number | null
  description?: string | null
  priceVND: number
  compareAtVND?: number | null
  visibility: string
  isEnded: boolean
  courseType: string
  teacherId?: number | null
  subject?: PublicSeoCourseSubjectDto | null
  teacher?: PublicSeoCourseTeacherDto | null
  lessonsCount: number
  trialLessonsCount: number
  enrollmentsCount: number
  isFree: boolean
  hasDiscount: boolean
  discountPercentage?: number
  thumbnail?: PublicSeoMediaFileDto
  createdAt: Date
  updatedAt: Date
}

export interface PublicSeoCourseDetailDto extends PublicSeoCourseSummaryDto {
  media: PublicSeoCourseMediaDto
  classes: PublicSeoCourseClassDto[]
  assistants: PublicSeoCourseAssistantDto[]
  lessons: PublicSeoCourseLessonDto[]
}

export class PublicSeoCourseListResponseDto extends PaginationResponseDto<PublicSeoCourseSummaryDto> {
  constructor(data: PublicSeoCourseSummaryDto[], page: number, limit: number, total: number) {
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasPrevious: page > 1,
      hasNext: page < Math.ceil(total / limit),
      previousPage: page > 1 ? page - 1 : undefined,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : undefined,
    }
    super(true, 'Lấy danh sách khóa học public online cho trang SEO thành công', data, meta)
  }
}

export class PublicSeoCourseDetailResponseDto extends BaseResponseDto<PublicSeoCourseDetailDto> {}
