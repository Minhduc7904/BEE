import type { AttendanceStatus } from '../../shared/enums/attendance-status.enum'

export interface ParentScheduleAttendance {
  attendanceId: number
  status: AttendanceStatus
  markedAt: Date
  notes: string | null
}

export interface ParentScheduleHomeworkSubmission {
  homeworkSubmitId: number
  points: number | null
}

export interface ParentScheduleHomework {
  homeworkId: number
  submission: ParentScheduleHomeworkSubmission | null
}

export interface ParentScheduleSession {
  sessionId: number
  classId: number
  name: string
  /** Date-only value stored as UTC midnight of the business calendar date. */
  sessionDate: Date
  /** Time-only values stored on 1970-01-01 in UTC, mirroring the TIME column. */
  startTime: Date
  endTime: Date
  className: string
  room: string | null
  instructorName: string | null
  makeupNote: string | null
  attendance: ParentScheduleAttendance | null
  homework: ParentScheduleHomework | null
}

/** Current moment in Asia/Ho_Chi_Minh, expressed with the same shapes as the sessionDate and TIME columns. */
export interface ParentScheduleClock {
  /** Today's calendar date as UTC midnight. */
  today: Date
  /** Current wall-clock time on 1970-01-01 in UTC. */
  timeOfDay: Date
}

export abstract class ParentStudentScheduleReadService {
  abstract isStudentLinked(parentId: number, studentId: number): Promise<boolean>

  /**
   * Lists every session of the student's classes plus sessions attended by that student
   * (for example, a makeup session in another class) between the two inclusive date-only bounds.
   * Results are ordered by sessionDate, startTime, sessionId; Attendance is scoped to that student.
   */
  abstract listSessionsInRange(studentId: number, from: Date, to: Date): Promise<ParentScheduleSession[]>

  /**
   * Finds the first session of a class the student is enrolled in (ClassStudent only) that has not ended yet:
   * sessionDate after `clock.today`, or on `clock.today` with endTime after `clock.timeOfDay`.
   * Results are ordered by sessionDate, startTime, sessionId, so an ongoing session always precedes upcoming ones.
   * Attendance is scoped to that student. Returns null when there is no such session.
   */
  abstract findNextSession(studentId: number, clock: ParentScheduleClock): Promise<ParentScheduleSession | null>
}
