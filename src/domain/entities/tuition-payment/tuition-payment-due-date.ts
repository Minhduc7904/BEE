import { DueDateSource } from '../../../shared/enums/due-date-source.enum'
import { getVietnamMonthEnd } from '../../../shared/utils/vietnam-month.util'

export interface TuitionDueDateInput {
  month: number
  year: number
  /** Hạn đóng khai báo rõ ràng. Hiện schema chưa có cột dueDate nên luôn là null/undefined. */
  explicitDueDate?: Date | null
}

export interface TuitionEffectiveDueDate {
  effectiveDueDate: Date
  source: DueDateSource
}

/**
 * effectiveDueDate = explicitDueDate ?? cuối tháng học phí (23:59:59.999 Asia/Ho_Chi_Minh).
 * Đây là định nghĩa hạn duy nhất của học phí; mọi nơi tính quá hạn phải dùng hàm này.
 */
export function resolveTuitionDueDate(input: TuitionDueDateInput): TuitionEffectiveDueDate {
  if (input.explicitDueDate) {
    return { effectiveDueDate: input.explicitDueDate, source: DueDateSource.EXPLICIT }
  }

  return {
    effectiveDueDate: getVietnamMonthEnd(input.month, input.year),
    source: DueDateSource.PERIOD_END,
  }
}

export function isTuitionOverdue(effectiveDueDate: Date, now: Date): boolean {
  return now.getTime() > effectiveDueDate.getTime()
}
