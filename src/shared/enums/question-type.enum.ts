// src/shared/enums/question-type.enum.ts

/**
 * Question Type Enum
 * Đồng bộ với Prisma schema enum QuestionType
 */
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  TRUE_FALSE = 'TRUE_FALSE',
}

/**
 * Question Type Labels
 */
export const QuestionTypeLabels: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: 'Trắc nghiệm một đáp án',
  [QuestionType.MULTIPLE_CHOICE]: 'Trắc nghiệm nhiều đáp án',
  [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
  [QuestionType.ESSAY]: 'Tự luận',
  [QuestionType.TRUE_FALSE]: 'Đúng/Sai',
}

/**
 * Question Type Icons for UI
 */
export const QuestionTypeIcons: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: '🔘',
  [QuestionType.MULTIPLE_CHOICE]: '☑️',
  [QuestionType.SHORT_ANSWER]: '💬',
  [QuestionType.ESSAY]: '📄',
  [QuestionType.TRUE_FALSE]: '✔️❌',
}
