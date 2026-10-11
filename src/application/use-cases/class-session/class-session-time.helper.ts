import { ClassSession } from '../../../domain/entities/class-session/class-session.entity'

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * HOUR_MS
const VN_OFFSET_MS = 7 * HOUR_MS

/** Số phút sau giờ bắt đầu thì coi học sinh vắng mặt chưa đến lớp để nhắc phụ huynh. */
export const ABSENT_REMINDER_DELAY_MINUTES = 15

export interface ClassSessionNotificationMoments {
  /** Mốc start + 15 phút: gửi "con chưa đến lớp". */
  reminderAt: Date
  /** Mốc hết giờ: gửi "con hôm nay vắng". */
  summaryAt: Date
}

/**
 * Ghép ngày lịch VN (cột DATE, nửa đêm UTC) với giờ của cột TIME thành thời điểm thật.
 *
 * Cột TIME lưu phần giờ-trong-ngày UTC của instant thật (admin và copy-base ghi instant thật),
 * nên giờ VN = giờ UTC + 7. Instant = nửa đêm UTC của ngày lịch − 7 giờ + giờ VN trong ngày.
 * Nhờ vậy buổi trước 07:00 sáng (giờ UTC rơi vào hôm trước) vẫn đúng ngày.
 */
export function getClassSessionInstant(sessionDate: Date, time: Date): Date {
  const dayStartUtc = Date.UTC(sessionDate.getUTCFullYear(), sessionDate.getUTCMonth(), sessionDate.getUTCDate())
  const utcTimeOfDay = ((time.getTime() % DAY_MS) + DAY_MS) % DAY_MS
  const vnTimeOfDay = (utcTimeOfDay + VN_OFFSET_MS) % DAY_MS
  return new Date(dayStartUtc - VN_OFFSET_MS + vnTimeOfDay)
}

/** Hai mốc thông báo của buổi học: start + 15 phút và hết giờ. */
export function getSessionNotificationMoments(
  session: Pick<ClassSession, 'sessionDate' | 'startTime' | 'endTime'>,
): ClassSessionNotificationMoments {
  const startAt = getClassSessionInstant(session.sessionDate, session.startTime)
  return {
    reminderAt: new Date(startAt.getTime() + ABSENT_REMINDER_DELAY_MINUTES * MINUTE_MS),
    summaryAt: getClassSessionInstant(session.sessionDate, session.endTime),
  }
}
