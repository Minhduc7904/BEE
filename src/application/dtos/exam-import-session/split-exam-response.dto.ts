import { SplitQuestion } from '../../../infrastructure/services/exam-split.service'

/**
 * DTO response cho API tách câu hỏi
 */
export class SplitExamResponseDto {
  questions: SplitQuestion[]
  totalQuestions: number
  processingTimeMs: number
}
