import type { ParentResultType } from '../../shared/enums/parent-result-type.enum'
import type { ParentResultCursor } from './parent-result-cursor.interface'

export interface ParentStudentResultCursorPagination {
  after: ParentResultCursor | null
  limit: number
}

export interface ParentHomeworkSubmissionListItem {
  homeworkSubmitId: number
  title: string
  submittedAt: Date
  points: number | null
  maxPoints: number | null
}

export interface ParentCompetitionSubmissionListItem {
  competitionSubmitId: number
  title: string
  submittedAt: Date | null
  points: number | null
  maxPoints: number | null
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

/** One submitted result used by the monthly dashboard summary; homework and standalone competition are merged. */
export interface ParentMonthlyResultItem {
  type: ParentResultType
  /** homeworkSubmitId for HOMEWORK, competitionSubmitId for COMPETITION. */
  resultId: number
  title: string
  submittedAt: Date
  points: number | null
  maxPoints: number | null
}

export interface ParentResultsSummary {
  month: number
  year: number
  totalResults: number
  scoredResults: number
  averageScore: number | null
  latestResult: ParentMonthlyResultItem | null
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

  /**
   * Lists every result submitted in [from, toExclusive): the student's HomeworkSubmit by submitAt plus standalone
   * CompetitionSubmit (no linked HomeworkSubmit, status SUBMITTED or GRADED) by submittedAt. A CompetitionSubmit linked
   * to a HomeworkSubmit is only represented by the homework item, so it is never counted twice.
   */
  abstract listMonthlyResults(studentId: number, from: Date, toExclusive: Date): Promise<ParentMonthlyResultItem[]>
}
