import { TempStatement } from '../entities/exam-import/temp-statement.entity'
import { Difficulty } from '../../shared/enums'

export interface CreateTempStatementData {
  tempQuestionId: string
  content: string
  isCorrect: boolean
  order?: number
  difficulty?: Difficulty
  metadata?: any
}

export interface UpdateTempStatementData {
  content?: string
  isCorrect?: boolean
  order?: number
  difficulty?: Difficulty
  metadata?: any
  statementId?: number
}

export interface ITempStatementRepository {
  create(data: CreateTempStatementData): Promise<TempStatement>
  findById(tempStatementId: string): Promise<TempStatement | null>
  findByTempQuestionId(tempQuestionId: string): Promise<TempStatement[]>
  findByStatementId(statementId: number): Promise<TempStatement | null>
  findAll(): Promise<TempStatement[]>
  update(tempStatementId: string, data: UpdateTempStatementData): Promise<TempStatement>
  delete(tempStatementId: string): Promise<void>
  linkToFinalStatement(tempStatementId: string, statementId: number): Promise<TempStatement>
}
