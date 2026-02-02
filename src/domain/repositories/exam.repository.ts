// src/domain/repositories/exam.repository.ts
import { Exam } from '../entities/exam/exam.entity'
import { ExamVisibility } from 'src/shared/enums'

export interface CreateExamData {
  title: string
  grade: number
  visibility: ExamVisibility
  adminId: number
  description?: string | null
  subjectId?: number | null
  solutionYoutubeUrl?: string | null
}

export interface IExamRepository {
  create(data: CreateExamData, txClient?: any): Promise<Exam>
  findById(id: number, txClient?: any): Promise<Exam | null>
  update(id: number, data: Partial<CreateExamData>, txClient?: any): Promise<Exam>
  delete(id: number, txClient?: any): Promise<void>
}
