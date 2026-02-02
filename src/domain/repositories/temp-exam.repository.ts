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
  findById(tempExamId: number): Promise<TempExam | null>
  findByIdWithRelations(tempExamId: number): Promise<TempExam | null>
  findBySessionId(sessionId: number): Promise<TempExam | null>
  findByExamId(examId: number): Promise<TempExam | null>
  findAll(): Promise<TempExam[]>
  update(tempExamId: number, data: UpdateTempExamData): Promise<TempExam>
  delete(tempExamId: number): Promise<void>
  linkToFinalExam(tempExamId: number, examId: number): Promise<TempExam>
}
