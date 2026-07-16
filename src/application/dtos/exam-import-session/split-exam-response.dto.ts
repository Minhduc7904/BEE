import { SplitQuestion } from 'src/application/interfaces'

/**
 * DTO response cho API tách câu hỏi
 */
export class SplitExamResponseDto {
  questions: SplitQuestion[]
  totalQuestions: number
  processingTimeMs: number
}
