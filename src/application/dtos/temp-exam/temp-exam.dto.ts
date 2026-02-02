// src/application/dtos/temp-exam/temp-exam.dto.ts
import { TempExam } from '../../../domain/entities/exam-import/temp-exam.entity'
import { ExamVisibility } from '../../../shared/enums'

export class TempExamResponseDto {
  tempExamId: number
  sessionId: number
  title: string
  description?: string | null
  grade?: number | null
  subjectId?: number | null
  subjectName?: string
  visibility: string
  metadata?: any
  examId?: number | null
  createdAt: Date
  updatedAt: Date

  // Computed
  hasDescription: boolean
  hasGrade: boolean
  hasSubject: boolean
  isMigrated: boolean

  static fromEntity(tempExam: TempExam): TempExamResponseDto {
    return {
      tempExamId: tempExam.tempExamId,
      sessionId: tempExam.sessionId,
      title: tempExam.title,
      description: tempExam.description ?? undefined,
      grade: tempExam.grade ?? undefined,
      subjectId: tempExam.subjectId ?? undefined,
      subjectName: tempExam.subject?.name,
      visibility: tempExam.visibility,
      metadata: tempExam.metadata,
      examId: tempExam.examId ?? undefined,
      createdAt: tempExam.createdAt,
      updatedAt: tempExam.updatedAt,
      hasDescription: tempExam.hasDescription(),
      hasGrade: tempExam.hasGrade(),
      hasSubject: tempExam.hasSubject(),
      isMigrated: tempExam.isMigrated(),
    }
  }
}
