// src/shared/enums/course-enrollment-status.enum.ts

/**
 * Course Enrollment Status Enum
 * Đồng bộ 100% với Prisma schema enum CourseEnrollmentStatus
 */
export enum CourseEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  BLOCKED_UNPAID = 'BLOCKED_UNPAID',
  TRIAL = 'TRIAL',
}

/**
 * Course Enrollment Status Labels
 */
export const CourseEnrollmentStatusLabels: Record<CourseEnrollmentStatus, string> = {
  [CourseEnrollmentStatus.ACTIVE]: 'Đang học',
  [CourseEnrollmentStatus.COMPLETED]: 'Hoàn thành',
  [CourseEnrollmentStatus.CANCELLED]: 'Đã huỷ',
  [CourseEnrollmentStatus.BLOCKED_UNPAID]: 'Bị chặn (chưa đóng học phí)',
  [CourseEnrollmentStatus.TRIAL]: 'Học thử',
}

/**
 * Course Enrollment Status Descriptions
 */
export const CourseEnrollmentStatusDescriptions: Record<CourseEnrollmentStatus, string> = {
  [CourseEnrollmentStatus.ACTIVE]: 'Học viên đang tham gia khóa học',
  [CourseEnrollmentStatus.COMPLETED]: 'Học viên đã hoàn thành khóa học',
  [CourseEnrollmentStatus.CANCELLED]: 'Học viên đã huỷ đăng ký khóa học',
  [CourseEnrollmentStatus.BLOCKED_UNPAID]: 'Học viên bị chặn do chưa hoàn tất học phí',
  [CourseEnrollmentStatus.TRIAL]: 'Học viên đang tham gia học thử khóa học',
}

/**
 * Course Enrollment Status Colors
 */
export const CourseEnrollmentStatusColors: Record<CourseEnrollmentStatus, string> = {
  [CourseEnrollmentStatus.ACTIVE]: 'green',
  [CourseEnrollmentStatus.COMPLETED]: 'blue',
  [CourseEnrollmentStatus.CANCELLED]: 'red',
  [CourseEnrollmentStatus.BLOCKED_UNPAID]: 'orange',
  [CourseEnrollmentStatus.TRIAL]: 'purple',
}

/**
 * Course Enrollment Status Icons
 */
export const CourseEnrollmentStatusIcons: Record<CourseEnrollmentStatus, string> = {
  [CourseEnrollmentStatus.ACTIVE]: '📘',
  [CourseEnrollmentStatus.COMPLETED]: '🎓',
  [CourseEnrollmentStatus.CANCELLED]: '❌',
  [CourseEnrollmentStatus.BLOCKED_UNPAID]: '💰',
  [CourseEnrollmentStatus.TRIAL]: '🧪',
}
