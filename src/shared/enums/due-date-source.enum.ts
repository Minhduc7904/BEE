// src/shared/enums/due-date-source.enum.ts

/**
 * Due Date Source Enum
 * Nguồn của hạn đóng học phí hiệu lực.
 * - EXPLICIT: hạn được khai báo rõ ràng (khi schema có dueDate).
 * - PERIOD_END: cuối tháng học phí (23:59:59.999 Asia/Ho_Chi_Minh).
 */
export enum DueDateSource {
  EXPLICIT = 'EXPLICIT',
  PERIOD_END = 'PERIOD_END',
}
