import { formatVnDate, formatVnDateISO } from '../../../../shared/utils/vietnam-date.util'

/**
 * Tên mặc định của buổi học sinh ra từ ca cơ sở: "Buổi dd/mm" theo ngày Việt Nam của ca.
 */
export function buildClassSessionName(startAt: Date): string {
  return `Buổi ${formatVnDate(startAt).slice(0, 5)}`
}

/**
 * `sessionDate` là cột DATE: giữ ngày lịch Việt Nam của ca ở dạng nửa đêm UTC.
 * Không dùng `toISOString().slice(0, 10)` vì ca 05:00 giờ VN vẫn thuộc ngày hôm trước theo UTC.
 */
export function toClassSessionDate(startAt: Date): Date {
  return new Date(`${formatVnDateISO(startAt)}T00:00:00.000Z`)
}

/**
 * Cột TIME chỉ giữ phần giờ trong ngày (UTC) của instant; dùng để so khớp buổi đã có với buổi sắp tạo.
 */
function toTimeOfDayKey(time: Date): string {
  return time.toISOString().slice(11, 19)
}

/** Khóa nhận diện một buổi trùng: cùng lớp, cùng ngày và cùng giờ bắt đầu. */
export function buildClassSessionKey(classId: number, sessionDate: Date, startTime: Date): string {
  return `${classId}|${sessionDate.toISOString().slice(0, 10)}|${toTimeOfDayKey(startTime)}`
}
