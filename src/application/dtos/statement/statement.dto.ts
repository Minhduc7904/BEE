// src/application/dtos/statement/statement.dto.ts
import { Statement } from '../../../domain/entities/exam/statement.entity'
import { Difficulty } from '../../../shared/enums'

/**
 * DTO for statement response
 * @description Contains statement information returned to client
 */
export class StatementResponseDto {
  statementId: number
  content: string
  questionId: number
  isCorrect: boolean
  order?: number | null
  difficulty?: Difficulty | null
  createdAt: Date
  updatedAt: Date

  // Processed content with presigned URLs (optional - set by use cases)
  processedContent?: string

  static fromEntity(entity: Statement): StatementResponseDto {
    const dto = new StatementResponseDto()
    dto.statementId = entity.statementId
    dto.content = entity.content
    dto.questionId = entity.questionId
    dto.isCorrect = entity.isCorrect
    dto.order = entity.order
    dto.difficulty = entity.difficulty
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }
}
