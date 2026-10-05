import type { DueDateSource } from '../../shared/enums/due-date-source.enum'

export interface ParentAttendanceStatusCounts {
  present: number
  absent: number
  late: number
  makeup: number
}

export interface ParentAttendanceSummary extends ParentAttendanceStatusCounts {
  month: number
  year: number
  total: number
  attended: number
  /** Percentage rounded to two decimals; 0 when total is 0. */
  attendanceRate: number
}

/** UNPAID tuition payment as stored; the due date is derived by the use case, not read from the database. */
export interface ParentUnpaidTuitionPayment {
  paymentId: number
  /** VND; null = amount not decided yet, 0 = free. */
  amount: number | null
  month: number
  year: number
}

export interface ParentOutstandingTuitionPayment extends ParentUnpaidTuitionPayment {
  effectiveDueDate: Date
  dueDateSource: DueDateSource
  isOverdue: boolean
}

export interface ParentOutstandingTuitionSummary {
  outstandingCount: number
  totalOutstandingAmount: number
  unknownAmountCount: number
  overdueCount: number
  primaryPayment: ParentOutstandingTuitionPayment | null
}

export abstract class ParentStudentDashboardReadService {
  abstract isStudentLinked(parentId: number, studentId: number): Promise<boolean>

  /**
   * Counts the student's existing Attendance records per status for sessions whose date-only sessionDate falls in
   * [from, toExclusive). Sessions without an Attendance record are not counted.
   */
  abstract countAttendanceByStatus(
    studentId: number,
    from: Date,
    toExclusive: Date,
  ): Promise<ParentAttendanceStatusCounts>

  /** Lists every UNPAID tuition payment of the student. */
  abstract listUnpaidTuitionPayments(studentId: number): Promise<ParentUnpaidTuitionPayment[]>
}
