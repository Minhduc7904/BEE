import type { ParentScheduleAttendance, ParentScheduleSession } from './parent-student-schedule.interface'

export interface ParentScheduleAttendanceDetail extends ParentScheduleAttendance {
  markerName: string | null
}

export interface ParentScheduleMakeupOption {
  classId: number
  className: string
  /** Date-only values stored as UTC midnight of the business calendar date. */
  startDate: Date | null
  endDate: Date | null
  weeklySchedule: string | null
  room: string | null
  instructorName: string | null
}

export interface ParentScheduleSessionDetail extends Omit<ParentScheduleSession, 'attendance'> {
  attendance: ParentScheduleAttendanceDetail | null
  makeupOptions: ParentScheduleMakeupOption[]
}

export abstract class ParentScheduleSessionDetailReadService {
  /**
   * Reads one session when it is in the student's scope: the student belongs to the session's class
   * or already has an Attendance in that session. Returns null otherwise, so callers cannot tell
   * "missing" from "out of scope". Attendance and homework are scoped to that student.
   *
   * Makeup options are the classes configured for the session's class; classes whose endDate is before
   * `makeupEndDateFrom` (a date-only value) are excluded, classes without an endDate are kept.
   */
  abstract findSessionDetail(
    studentId: number,
    sessionId: number,
    makeupEndDateFrom: Date,
  ): Promise<ParentScheduleSessionDetail | null>
}
