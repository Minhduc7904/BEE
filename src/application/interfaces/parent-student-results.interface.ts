import { CompetitionSubmitStatus, HomeworkContentType } from '../../shared/enums'
import type { ParentResultCursor } from './parent-result-cursor.interface'

export interface ParentStudentResultCursorPagination {
  after: ParentResultCursor | null
  limit: number
}

export interface ParentHomeworkSubmissionListItem {
  homeworkSubmitId: number
  title: string
  homeworkType: HomeworkContentType
  submittedAt: Date
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null
}

export interface ParentCompetitionSubmissionListItem {
  competitionSubmitId: number
  title: string
  attemptNumber: number
  status: CompetitionSubmitStatus
  submittedAt: Date | null
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null
}

export interface ParentStudentSubmissionCursorListResult<T> {
  data: T[]
  hasNext: boolean
  nextCursor: string | null
}

export interface ParentStudentSubmissionStatistics {
  totalSubmissions: number
  averageScore: number | null
  scoredSubmissions: number
}

export interface ParentSubmissionSectionScore {
  sectionId: number | null
  title: string
  order: number | null
  points: number
  maxPoints: number
}

export interface ParentHomeworkSubmissionDetail {
  homeworkSubmitId: number
  studentId: number
  title: string
  submittedAt: Date
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null
  sectionScores: ParentSubmissionSectionScore[]
}

export interface ParentCompetitionSubmissionDetail {
  competitionSubmitId: number
  studentId: number
  title: string
  attemptNumber: number
  submittedAt: Date | null
  gradedAt: Date | null
  points: number | null
  maxPoints: number | null
  feedback: string | null
  sectionScores: ParentSubmissionSectionScore[]
}

export abstract class ParentStudentResultsReadService {
  abstract isStudentLinked(parentId: number, studentId: number): Promise<boolean>

  abstract listHomeworkSubmissions(
    studentId: number,
    pagination: ParentStudentResultCursorPagination,
  ): Promise<ParentStudentSubmissionCursorListResult<ParentHomeworkSubmissionListItem>>

  abstract getHomeworkSubmissionStatistics(studentId: number): Promise<ParentStudentSubmissionStatistics>

  abstract getHomeworkSubmissionDetail(
    studentId: number,
    homeworkSubmitId: number,
  ): Promise<ParentHomeworkSubmissionDetail | null>

  abstract listStandaloneCompetitionSubmissions(
    studentId: number,
    pagination: ParentStudentResultCursorPagination,
  ): Promise<ParentStudentSubmissionCursorListResult<ParentCompetitionSubmissionListItem>>

  abstract getStandaloneCompetitionSubmissionStatistics(studentId: number): Promise<ParentStudentSubmissionStatistics>

  abstract getStandaloneCompetitionSubmissionDetail(
    studentId: number,
    competitionSubmitId: number,
  ): Promise<ParentCompetitionSubmissionDetail | null>
}
