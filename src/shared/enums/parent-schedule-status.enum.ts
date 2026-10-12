// src/shared/enums/parent-schedule-status.enum.ts

/**
 * Parent Schedule Status Enum
 * Trạng thái thời gian của buổi học tiếp theo tại thời điểm hiện tại (Asia/Ho_Chi_Minh).
 * Học bù không phải trạng thái thời gian; nó nằm ở AttendanceType của điểm danh.
 */
export enum ParentScheduleStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  UPCOMING = 'UPCOMING',
}
