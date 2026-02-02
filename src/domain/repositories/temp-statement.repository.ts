import { TempStatement } from '../entities/exam-import/temp-statement.entity'
import { Difficulty } from '../../shared/enums'

export interface CreateTempStatementData {
  tempQuestionId: number
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
  findById(tempStatementId: number): Promise<TempStatement | null>
  findByTempQuestionId(tempQuestionId: number): Promise<TempStatement[]>
  findByStatementId(statementId: number): Promise<TempStatement | null>
  findAll(): Promise<TempStatement[]>
  update(tempStatementId: number, data: UpdateTempStatementData): Promise<TempStatement>
  delete(tempStatementId: number): Promise<void>
  linkToFinalStatement(tempStatementId: number, statementId: number): Promise<TempStatement>
}
