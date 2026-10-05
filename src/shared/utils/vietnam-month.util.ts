// src/shared/utils/vietnam-month.util.ts

/**
 * Vietnam Month Utility
 * Khoảng thời gian theo tháng ở Asia/Ho_Chi_Minh. Việt Nam là UTC+7 cố định (không có DST)
 * nên dịch bằng offset là chính xác, cùng cách tiếp cận với vietnam-date.util.
 */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000

export interface VietnamMonthRange {
  /** Thời điểm UTC của 00:00:00.000 ngày đầu tháng (giờ Việt Nam) – cận dưới, bao gồm. */
  start: Date
  /** Thời điểm UTC của 00:00:00.000 ngày đầu tháng kế tiếp (giờ Việt Nam) – cận trên, không bao gồm. */
  endExclusive: Date
}

/**
 * Khoảng [đầu tháng, đầu tháng kế tiếp) theo giờ Việt Nam, quy đổi sang UTC để query cột timestamp.
 * Việt Nam là UTC+7 cố định (không có DST) nên dịch bằng offset là chính xác.
 *
 * @example
 * getVietnamMonthRange(10, 2026) // { start: 2026-09-30T17:00:00.000Z, endExclusive: 2026-10-31T17:00:00.000Z }
 */
export function getVietnamMonthRange(month: number, year: number): VietnamMonthRange {
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - VN_OFFSET_MS),
    endExclusive: new Date(Date.UTC(year, month, 1) - VN_OFFSET_MS),
  }
}

/**
 * Thời điểm cuối cùng của tháng theo giờ Việt Nam (23:59:59.999), biểu diễn bằng UTC.
 *
 * @example
 * getVietnamMonthEnd(9, 2026) // 2026-09-30T16:59:59.999Z
 */
export function getVietnamMonthEnd(month: number, year: number): Date {
  return new Date(getVietnamMonthRange(month, year).endExclusive.getTime() - 1)
}

/**
 * Khoảng [ngày đầu tháng, ngày đầu tháng kế tiếp) cho cột date-only (@db.Date), lưu dưới dạng UTC midnight
 * của ngày lịch nghiệp vụ nên không cần dịch múi giờ.
 */
export function getMonthDateOnlyRange(month: number, year: number): { from: Date; toExclusive: Date } {
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    toExclusive: new Date(Date.UTC(year, month, 1)),
  }
}
