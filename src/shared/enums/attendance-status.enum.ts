// src/shared/enums/attendance-status.enum.ts

/**
 * Attendance Status Enum
 * Đồng bộ 100% với Prisma schema enum AttendanceStatus
 */
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  MAKEUP = 'MAKEUP',
}

/**
 * Attendance Status Labels
 */
export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Có mặt',
  [AttendanceStatus.ABSENT]: 'Vắng mặt',
  [AttendanceStatus.LATE]: 'Đi muộn',
  [AttendanceStatus.MAKEUP]: 'Học bù',
}

/**
 * Attendance Status Descriptions
 */
export const AttendanceStatusDescriptions: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Học sinh có mặt đầy đủ',
  [AttendanceStatus.ABSENT]: 'Học sinh vắng mặt',
  [AttendanceStatus.LATE]: 'Học sinh đến muộn',
  [AttendanceStatus.MAKEUP]: 'Học sinh học bù cho buổi đã vắng',
}

/**
 * Attendance Status Colors
 */
export const AttendanceStatusColors: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'green',
  [AttendanceStatus.ABSENT]: 'red',
  [AttendanceStatus.LATE]: 'orange',
  [AttendanceStatus.MAKEUP]: 'purple',
}

/**
 * Attendance Status Icons
 */
export const AttendanceStatusIcons: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: '✓',
  [AttendanceStatus.ABSENT]: '✗',
  [AttendanceStatus.LATE]: '⏰',
  [AttendanceStatus.MAKEUP]: '🔄',
}
