import type { SessionMakeupPair } from '../../../domain/interface/session-makeup-registration/session-makeup-registration.interface'

const DAY_MS = 24 * 60 * 60 * 1000

export interface MakeupPairSessionSource {
  sessionId: number
  classId: number
  sessionDate: Date
}

/**
 * Thứ Hai (UTC midnight) của tuần Thứ Hai đến Chủ Nhật chứa `sessionDate`.
 * Cột `session_date` là DATE nên được trao đổi dưới dạng UTC midnight; ngày không phụ thuộc múi giờ máy chủ.
 */
export function getWeekStart(sessionDate: Date): Date {
  const dayStart = Date.UTC(sessionDate.getUTCFullYear(), sessionDate.getUTCMonth(), sessionDate.getUTCDate())
  const daysSinceMonday = (new Date(dayStart).getUTCDay() + 6) % 7
  return new Date(dayStart - daysSinceMonday * DAY_MS)
}

/**
 * Khóa tuần dạng YYYY-MM-DD của Thứ Hai chứa `sessionDate`.
 */
export function getWeekStartKey(sessionDate: Date): string {
  return getWeekStart(sessionDate).toISOString().slice(0, 10)
}

/**
 * Chủ Nhật (UTC midnight) của tuần chứa `sessionDate`.
 */
export function getWeekEnd(sessionDate: Date): Date {
  return new Date(getWeekStart(sessionDate).getTime() + 6 * DAY_MS)
}

/**
 * Dựng mọi cặp có hướng (A bù được B và B bù được A) giữa các buổi khác lớp, cùng nhóm học bù hiệu lực
 * và cùng tuần Thứ Hai đến Chủ Nhật.
 *
 * - `classToGroupId`: lớp -> nhóm học bù hiệu lực (từ 2 lớp). Lớp không có trong map không tạo cặp nào.
 * - Hai buổi cùng lớp không bao giờ ghép với nhau.
 */
export function buildMakeupPairs(
  sessions: MakeupPairSessionSource[],
  classToGroupId: Map<number, number>,
): SessionMakeupPair[] {
  const buckets = new Map<string, MakeupPairSessionSource[]>()

  for (const session of sessions) {
    const groupId = classToGroupId.get(session.classId)

    if (groupId === undefined) continue

    const key = `${groupId}|${getWeekStartKey(session.sessionDate)}`
    const bucket = buckets.get(key)

    if (bucket) {
      bucket.push(session)
    } else {
      buckets.set(key, [session])
    }
  }

  const pairs: SessionMakeupPair[] = []

  for (const bucket of buckets.values()) {
    for (const left of bucket) {
      for (const right of bucket) {
        if (left.sessionId !== right.sessionId && left.classId !== right.classId) {
          pairs.push({ sessionId: left.sessionId, makeupSessionId: right.sessionId })
        }
      }
    }
  }

  return pairs
}
