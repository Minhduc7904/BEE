import { TempExam } from '../entities/exam-import/temp-exam.entity'
import { ExamVisibility } from '../../shared/enums'

export interface CreateTempExamData {
  sessionId: number
  title: string
  description?: string
  grade?: number
  subjectId?: number
  visibility?: ExamVisibility
  metadata?: any
  rawContent?: string
}

export interface UpdateTempExamData {
  title?: string
  description?: string
  grade?: number
  subjectId?: number
  visibility?: ExamVisibility
  metadata?: any
  rawContent?: string
  examId?: number
}

export interface ITempExamRepository {
  create(data: CreateTempExamData): Promise<TempExam>
  findById(tempExamId: string): Promise<TempExam | null>
  findByIdWithRelations(tempExamId: string): Promise<TempExam | null>
  findBySessionId(sessionId: number): Promise<TempExam | null>
  findByExamId(examId: number): Promise<TempExam | null>
  findAll(): Promise<TempExam[]>
  update(tempExamId: string, data: UpdateTempExamData): Promise<TempExam>
  delete(tempExamId: string): Promise<void>
  linkToFinalExam(tempExamId: string, examId: number): Promise<TempExam>
}
