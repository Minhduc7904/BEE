// src/domain/repositories/question.repository.ts
import { Question } from '../entities/exam/question.entity'
import { QuestionType, Difficulty, Visibility } from 'src/shared/enums'

export interface CreateQuestionData {
  content: string
  type: QuestionType
  difficulty: Difficulty | null
  grade?: number | null
  visibility: Visibility
  createdBy: number
  correctAnswer?: string | null
  solution?: string | null
  solutionYoutubeUrl?: string | null
  subjectId?: number | null
  pointsOrigin?: number | null
}

export interface IQuestionRepository {
  create(data: CreateQuestionData, txClient?: any): Promise<Question>
  createMany(dataArray: CreateQuestionData[], txClient?: any): Promise<number>
  findById(id: number, txClient?: any): Promise<Question | null>
  findByIds(ids: number[], txClient?: any): Promise<Question[]>
  update(id: number, data: Partial<CreateQuestionData>, txClient?: any): Promise<Question>
  delete(id: number, txClient?: any): Promise<void>
}
