import type { ParentScheduleClock } from '../../interfaces'
import { ParentScheduleStatus } from '../../../shared/enums/parent-schedule-status.enum'
import { ValidationException } from '../../../shared/exceptions/custom-exceptions'

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

export interface ParentScheduleWeekRange {
  weekStart: string
  weekEnd: string
  from: Date
  to: Date
}

/** Date-only columns are exchanged as UTC midnight, so the calendar date never depends on server timezone. */
export function formatScheduleDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

/** TIME columns are exchanged as 1970-01-01 UTC, so the wall-clock time never depends on server timezone. */
export function formatScheduleTime(value: Date): string {
  return value.toISOString().slice(11, 19)
}

/** Current calendar date in Asia/Ho_Chi_Minh, as date-only UTC midnight (same shape as @db.Date columns). */
export function resolveVietnamToday(now: Date): Date {
  const key = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return new Date(`${key}T00:00:00.000Z`)
}

/** Current wall-clock time in Asia/Ho_Chi_Minh as a TIME-column value (1970-01-01 UTC). */
export function resolveVietnamClock(now: Date): ParentScheduleClock {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now)
  return {
    today: resolveVietnamToday(now),
    timeOfDay: new Date(`1970-01-01T${parts}.000Z`),
  }
}

/** ONGOING when the session already started today; otherwise it starts later today or on a future date. */
export function resolveScheduleStatus(
  session: { sessionDate: Date; startTime: Date },
  clock: ParentScheduleClock,
): ParentScheduleStatus {
  const startedToday =
    session.sessionDate.getTime() === clock.today.getTime() && session.startTime.getTime() <= clock.timeOfDay.getTime()
  return startedToday ? ParentScheduleStatus.ONGOING : ParentScheduleStatus.UPCOMING
}

export function resolveScheduleWeek(weekStart: string): ParentScheduleWeekRange {
  const match = DATE_ONLY.exec(weekStart)
  if (!match) {
    throw new ValidationException('Ngày bắt đầu tuần không hợp lệ')
  }

  const from = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(from.getTime()) || formatScheduleDate(from) !== weekStart) {
    throw new ValidationException('Ngày bắt đầu tuần không hợp lệ')
  }
  if (from.getUTCDay() !== 1) {
    throw new ValidationException('Ngày bắt đầu tuần phải là thứ Hai')
  }

  const to = new Date(from.getTime() + 6 * DAY_MS)
  return { weekStart, weekEnd: formatScheduleDate(to), from, to }
}
