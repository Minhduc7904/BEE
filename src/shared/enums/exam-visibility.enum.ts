  // src/shared/enums/exam-visibility.enum.ts
/**
 * Exam Visibility Enum
 * Đồng bộ với Prisma schema enum ExamVisibility
 */
export enum ExamVisibility {
  DRAFT = 'DRAFT',
  PRIVATE = 'PRIVATE',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Exam Visibility Labels
 */
export const ExamVisibilityLabels: Record<ExamVisibility, string> = {
  [ExamVisibility.DRAFT]: 'Bản nháp',
  [ExamVisibility.PRIVATE]: 'Riêng tư',
  [ExamVisibility.PUBLISHED]: 'Công khai',
  [ExamVisibility.ARCHIVED]: 'Đã lưu trữ',
}

/**
 * Exam Visibility Descriptions
 */
export const ExamVisibilityDescriptions: Record<ExamVisibility, string> = {
  [ExamVisibility.DRAFT]: 'Khóa học đang trong quá trình phát triển',
  [ExamVisibility.PRIVATE]: 'Chỉ admin và giáo viên có thể xem',
  [ExamVisibility.PUBLISHED]: 'Tất cả học sinh có thể đăng ký',
  [ExamVisibility.ARCHIVED]: 'Đã lưu trữ',
}
