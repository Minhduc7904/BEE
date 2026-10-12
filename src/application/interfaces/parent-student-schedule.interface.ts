import type { AttendanceStatus } from '../../shared/enums/attendance-status.enum'
import type { AttendanceType } from '../../shared/enums/attendance-type.enum'
import type { ParentNextScheduleSource } from '../../shared/enums/parent-next-schedule-source.enum'
import type { ParentScheduleStatus } from '../../shared/enums/parent-schedule-status.enum'

/** Bản ghi học bù (Có mặt/Muộn + MAKEUP) mà một buổi vắng đã được bù bằng. */
export interface ParentScheduleMakeupReference {
  attendanceId: number
  sessionId: number
  classId: number
  className: string
  /** Date-only value stored as UTC midnight of the business calendar date. */
  sessionDate: Date
  /** Time-only values stored on 1970-01-01 in UTC, mirroring the TIME column. */
  startTime: Date
  endTime: Date
}

export interface ParentScheduleAttendance {
  attendanceId: number
  status: AttendanceStatus
  attendanceType: AttendanceType
  makeupByAttendanceId: number | null
  /** True only for an ABSENT record that is linked to a makeup attendance. */
  isMadeUp: boolean
  makeupBy: ParentScheduleMakeupReference | null
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

/** Class facts shown when the student has no upcoming session yet; dates are date-only UTC midnight. */
export interface ParentNextScheduleClass {
  classId: number
  className: string
  weeklySchedule: string | null
  classStartDate: Date | null
  classEndDate: Date | null
  room: string | null
  instructorName: string | null
}

/** Next session plus the facts of its class, so the card can show them without a second request. */
export interface ParentNextScheduleSession extends ParentScheduleSession {
  classWeeklySchedule: string | null
  classStartDate: Date | null
  classEndDate: Date | null
}

/**
 * Result of "next lesson": `SESSION` carries a concrete session, `CLASS_FALLBACK` only the class that
 * will hold it. Class facts always exist; session facts exist only for `SESSION`.
 */
export type ParentNextScheduleOverview =
  | {
      source: ParentNextScheduleSource.SESSION
      scheduleClass: ParentNextScheduleClass
      session: ParentScheduleSession
      scheduleStatus: ParentScheduleStatus
    }
  | {
      source: ParentNextScheduleSource.CLASS_FALLBACK
      scheduleClass: ParentNextScheduleClass
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
   * Finds the first session that has not ended yet, among sessions of every class the student is enrolled in
   * (ClassStudent) plus sessions of other classes where the student already has an Attendance:
   * sessionDate after `clock.today`, or on `clock.today` with endTime after `clock.timeOfDay`.
   * Results are ordered by sessionDate, startTime, sessionId, so an ongoing session always precedes upcoming ones.
   * Attendance is scoped to that student. Returns null when there is no such session.
   */
  abstract findNextSession(studentId: number, clock: ParentScheduleClock): Promise<ParentNextScheduleSession | null>

  /**
   * Lists the classes the student is enrolled in (ClassStudent only) that have not ended before `today`
   * (endDate null or endDate >= today). The use case picks the fallback class from these candidates.
   */
  abstract listNonEndedEnrolledClasses(studentId: number, today: Date): Promise<ParentNextScheduleClass[]>
}
