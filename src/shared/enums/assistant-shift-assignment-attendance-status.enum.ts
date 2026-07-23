/**
 * Đồng bộ với Prisma enum AssistantShiftAssignmentAttendanceStatus.
 * PENDING biểu thị phân công chưa được chấm công.
 */
export enum AssistantShiftAssignmentAttendanceStatus {
  PENDING = 'PENDING',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
}

export const AssistantShiftAssignmentAttendanceStatusLabels: Record<
  AssistantShiftAssignmentAttendanceStatus,
  string
> = {
  [AssistantShiftAssignmentAttendanceStatus.PENDING]: 'Chưa chấm công',
  [AssistantShiftAssignmentAttendanceStatus.PRESENT]: 'Đã đi làm',
  [AssistantShiftAssignmentAttendanceStatus.ABSENT]: 'Nghỉ',
}
