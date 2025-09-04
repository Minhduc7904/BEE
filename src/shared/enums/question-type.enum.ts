// src/shared/enums/question-type.enum.ts

/**
 * Question Type Enum
 * Đồng bộ với Prisma schema enum QuestionType
 */
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}

/**
 * Question Type Labels
 */
export const QuestionTypeLabels: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: 'Trắc nghiệm một đáp án',
  [QuestionType.MULTIPLE_CHOICE]: 'Trắc nghiệm nhiều đáp án',
  [QuestionType.FILL_IN_THE_BLANK]: 'Điền vào chỗ trống',
  [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
  [QuestionType.ESSAY]: 'Tự luận',
};

/**
 * Question Type Icons for UI
 */
export const QuestionTypeIcons: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: '🔘',
  [QuestionType.MULTIPLE_CHOICE]: '☑️',
  [QuestionType.FILL_IN_THE_BLANK]: '📝',
  [QuestionType.SHORT_ANSWER]: '💬',
  [QuestionType.ESSAY]: '📄',
};
