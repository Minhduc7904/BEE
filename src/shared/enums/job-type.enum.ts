// src/shared/enums/job-type.enum.ts
/**
 * Job Type Enum
 * Đồng bộ với Prisma schema enum JobType
 */
export enum JobType {
  AI_EXAM_PARSE = 'AI_EXAM_PARSE',
  AI_QUESTION_GENERATE = 'AI_QUESTION_GENERATE',
  AI_CONTENT_GENERATE = 'AI_CONTENT_GENERATE',
  AI_GRADING = 'AI_GRADING',
  EMAIL_SEND = 'EMAIL_SEND',
  REPORT_GENERATE = 'REPORT_GENERATE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
}

/**
 * Job Type Labels
 */
export const JobTypeLabels: Record<JobType, string> = {
  [JobType.AI_EXAM_PARSE]: 'Parse đề thi bằng AI',
  [JobType.AI_QUESTION_GENERATE]: 'Tạo câu hỏi bằng AI',
  [JobType.AI_CONTENT_GENERATE]: 'Tạo nội dung bằng AI',
  [JobType.AI_GRADING]: 'Chấm bài tự động bằng AI',
  [JobType.EMAIL_SEND]: 'Gửi email',
  [JobType.REPORT_GENERATE]: 'Tạo báo cáo',
  [JobType.DATA_EXPORT]: 'Xuất dữ liệu',
  [JobType.DATA_IMPORT]: 'Import dữ liệu',
}

/**
 * Job Type Icons (for UI)
 */
export const JobTypeIcons: Record<JobType, string> = {
  [JobType.AI_EXAM_PARSE]: '🤖',
  [JobType.AI_QUESTION_GENERATE]: '✨',
  [JobType.AI_CONTENT_GENERATE]: '📝',
  [JobType.AI_GRADING]: '✅',
  [JobType.EMAIL_SEND]: '📧',
  [JobType.REPORT_GENERATE]: '📊',
  [JobType.DATA_EXPORT]: '📤',
  [JobType.DATA_IMPORT]: '📥',
}

/**
 * Kiểm tra job có phải là AI job không
 */
export function isAIJob(type: JobType): boolean {
  return [
    JobType.AI_EXAM_PARSE,
    JobType.AI_QUESTION_GENERATE,
    JobType.AI_CONTENT_GENERATE,
    JobType.AI_GRADING,
  ].includes(type)
}
