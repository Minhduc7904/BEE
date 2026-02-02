// src/domain/repositories/statement.repository.ts
import { Statement } from '../entities/exam/statement.entity'
import { Difficulty } from 'src/shared/enums'

export interface CreateStatementData {
  content: string
  questionId: number
  isCorrect: boolean
  order: number
  difficulty?: Difficulty | null
}

export interface IStatementRepository {
  create(data: CreateStatementData, txClient?: any): Promise<Statement>
  createMany(dataArray: CreateStatementData[], txClient?: any): Promise<number>
  findById(id: number, txClient?: any): Promise<Statement | null>
  findByQuestionId(questionId: number, txClient?: any): Promise<Statement[]>
  findByQuestionIds(questionIds: number[], txClient?: any): Promise<Statement[]>
  update(id: number, data: Partial<CreateStatementData>, txClient?: any): Promise<Statement>
  delete(id: number, txClient?: any): Promise<void>
}
