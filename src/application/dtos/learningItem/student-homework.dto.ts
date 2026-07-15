import { HomeworkContentType, LearningItemType, Visibility } from 'src/shared/enums'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'

type StudentHomeworkSubmitSource = {
  homeworkSubmitId: number
  homeworkContentId: number
  competitionSubmitId: number | null
  submitAt: Date
  content: string
  points: number | null
  gradedAt: Date | null
  graderId: number | null
  feedback: string | null
  createdAt: Date
  updatedAt: Date
}

type StudentHomeworkCompetitionSource = {
  competitionId: number
  title: string
  subtitle: string | null
  startDate: Date | null
  endDate: Date | null
  durationMinutes: number | null
  maxAttempts: number | null
  examId: number | null
  visibility: `${Visibility}`
  showResultDetail: boolean
  allowLeaderboard: boolean
  allowViewScore: boolean
  allowViewAnswer: boolean
  enableAntiCheating: boolean
  allowViewSolutionYoutubeUrl: boolean
  allowViewExamContent: boolean
}

type StudentHomeworkContentSource = {
  homeworkContentId: number
  type: `${HomeworkContentType}`
  content: string
  dueDate: Date | null
  allowLateSubmit: boolean
  competitionId: number | null
  competition: StudentHomeworkCompetitionSource | null
}

type StudentLearningItemSource = {
  isLearned: boolean
  learnedAt: Date | null
}

type StudentHomeworkLessonSource = {
  lessonId: number
  title: string
  courseId: number
}

type StudentHomeworkLearningItemSource = {
  learningItemId: number
  title: string
  description: string | null
  type: `${LearningItemType}`
  createdAt: Date
  updatedAt: Date
}

export class StudentHomeworkCompetitionDto {
  competitionId: number
  title: string
  subtitle: string | null
  startDate: Date | null
  endDate: Date | null
  durationMinutes: number | null
  maxAttempts: number | null
  examId: number | null
  visibility: Visibility
  showResultDetail: boolean
  allowLeaderboard: boolean
  allowViewScore: boolean
  allowViewAnswer: boolean
  enableAntiCheating: boolean
  allowViewSolutionYoutubeUrl: boolean
  allowViewExamContent: boolean

  static fromPrisma(competition: StudentHomeworkCompetitionSource): StudentHomeworkCompetitionDto {
    const dto = new StudentHomeworkCompetitionDto()
    Object.assign(dto, competition, {
      visibility: competition.visibility as Visibility,
    })
    return dto
  }
}

export class StudentHomeworkSubmitDto {
  homeworkSubmitId: number
  homeworkContentId: number
  competitionSubmitId: number | null
  submitAt: Date
  content: string
  points: number | null
  gradedAt: Date | null
  graderId: number | null
  feedback: string | null
  createdAt: Date
  updatedAt: Date

  static fromPrisma(homeworkSubmit: StudentHomeworkSubmitSource): StudentHomeworkSubmitDto {
    const dto = new StudentHomeworkSubmitDto()
    dto.homeworkSubmitId = homeworkSubmit.homeworkSubmitId
    dto.homeworkContentId = homeworkSubmit.homeworkContentId
    dto.competitionSubmitId = homeworkSubmit.competitionSubmitId
    dto.submitAt = homeworkSubmit.submitAt
    dto.content = homeworkSubmit.content
    dto.points = homeworkSubmit.points
    dto.gradedAt = homeworkSubmit.gradedAt
    dto.graderId = homeworkSubmit.graderId
    dto.feedback = homeworkSubmit.feedback
    dto.createdAt = homeworkSubmit.createdAt
    dto.updatedAt = homeworkSubmit.updatedAt
    return dto
  }
}

export class HomeworkContentWithStatusDto {
  homeworkContentId: number
  type: HomeworkContentType
  content: string
  dueDate: Date | null
  allowLateSubmit: boolean
  competitionId: number | null
  competition: StudentHomeworkCompetitionDto | null
  isSubmitted: boolean
  submittedAt: Date | null
  isGraded: boolean
  points: number | null
  feedback: string | null
  homeworkSubmit: StudentHomeworkSubmitDto | null
  isOverdue: boolean
  canSubmit: boolean

  constructor(data: {
    homeworkContent: StudentHomeworkContentSource
    homeworkSubmit: StudentHomeworkSubmitDto | null
  }) {
    const { homeworkContent, homeworkSubmit } = data

    this.homeworkContentId = homeworkContent.homeworkContentId
    this.type = homeworkContent.type as HomeworkContentType
    this.content = homeworkContent.content
    this.dueDate = homeworkContent.dueDate
    this.allowLateSubmit = homeworkContent.allowLateSubmit
    this.competitionId = homeworkContent.competitionId
    this.competition = homeworkContent.competition
      ? StudentHomeworkCompetitionDto.fromPrisma(homeworkContent.competition)
      : null

    this.homeworkSubmit = homeworkSubmit
    this.isSubmitted = homeworkSubmit !== null
    this.submittedAt = homeworkSubmit?.submitAt ?? null
    this.isGraded = Boolean(homeworkSubmit && (homeworkSubmit.points !== null || homeworkSubmit.gradedAt !== null))
    this.points = homeworkSubmit?.points ?? null
    this.feedback = homeworkSubmit?.feedback ?? null
    const now = Date.now()
    const isHomeworkDeadlineExpired = Boolean(this.dueDate && this.dueDate.getTime() < now)
    const isCompetitionDeadlineExpired = Boolean(
      this.type === HomeworkContentType.COMPETITION &&
        this.competition?.endDate &&
        this.competition.endDate.getTime() < now,
    )

    this.isOverdue = isHomeworkDeadlineExpired || isCompetitionDeadlineExpired
    this.canSubmit =
      !this.isSubmitted && !isCompetitionDeadlineExpired && (!isHomeworkDeadlineExpired || this.allowLateSubmit)
  }
}

export class StudentHomeworkResponseDto {
  learningItemId: number
  title: string
  description: string | null
  type: LearningItemType
  createdAt: Date
  updatedAt: Date
  homeworkContents: HomeworkContentWithStatusDto[]
  isLearned: boolean
  learnedAt: Date | null
  lessonId: number | null
  courseId: number | null
  lessonTitle: string | null

  constructor(data: {
    learningItem: StudentHomeworkLearningItemSource
    homeworkContents: HomeworkContentWithStatusDto[]
    studentLearningItem?: StudentLearningItemSource
    lesson?: StudentHomeworkLessonSource
  }) {
    this.learningItemId = data.learningItem.learningItemId
    this.title = data.learningItem.title
    this.description = data.learningItem.description ?? null
    this.type = data.learningItem.type as LearningItemType
    this.createdAt = data.learningItem.createdAt
    this.updatedAt = data.learningItem.updatedAt
    this.homeworkContents = data.homeworkContents
    this.isLearned = data.studentLearningItem?.isLearned ?? false
    this.learnedAt = data.studentLearningItem?.learnedAt ?? null
    this.lessonId = data.lesson?.lessonId ?? null
    this.lessonTitle = data.lesson?.title ?? null
    this.courseId = data.lesson?.courseId ?? null
  }
}

export class StudentHomeworkListResponseDto extends PaginationResponseDto<StudentHomeworkResponseDto> {
  constructor(data: StudentHomeworkResponseDto[], page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit)
    const hasPrevious = page > 1
    const hasNext = page < totalPages

    super(true, 'Lấy danh sách bài tập thành công', data, {
      page,
      limit,
      total,
      totalPages,
      hasPrevious,
      hasNext,
      previousPage: hasPrevious ? page - 1 : undefined,
      nextPage: hasNext ? page + 1 : undefined,
    })
  }
}
