// src/shared/utils/vietnam-date.util.ts

/**
 * Vietnam Date Utility
 * Xử lý date/time sang giờ Việt Nam (UTC+7) bằng cách thủ công +7 giờ
 *
 * Tất cả hàm đều convert sang UTC+7 trước khi format
 * Không dùng toLocaleString hay Intl.DateTimeFormat để đảm bảo kết quả nhất quán
 */

const VN_OFFSET_HOURS = 7
const VN_OFFSET_MS = VN_OFFSET_HOURS * 60 * 60 * 1000

/**
 * Convert một Date/string sang Date đã dịch về giờ Việt Nam (UTC+7)
 * Kết quả là Date object có getUTC*() trả về giá trị giờ VN
 */
function toVietnamDate(input: Date | string | number): Date {
    const date = input instanceof Date ? input : new Date(input)
    return new Date(date.getTime() + VN_OFFSET_MS)
}

/**
 * Pad số thành 2 chữ số
 */
function pad(n: number): string {
    return String(n).padStart(2, '0')
}

/**
 * Format date sang dạng dd/MM/yyyy (giờ Việt Nam)
 *
 * @example
 * formatVnDate('2026-03-05T10:30:00Z') // '05/03/2026'
 */
export function formatVnDate(input: Date | string | number | null | undefined): string {
    if (!input) return 'N/A'
    try {
        const vn = toVietnamDate(input)
        const day = pad(vn.getUTCDate())
        const month = pad(vn.getUTCMonth() + 1)
        const year = vn.getUTCFullYear()
        return `${day}/${month}/${year}`
    } catch {
        return String(input)
    }
}

/**
 * Format date sang dạng yyyy-MM-dd (giờ Việt Nam)
 * Thường dùng cho filename hoặc ISO-like format
 *
 * @example
 * formatVnDateISO('2026-03-05T20:00:00Z') // '2026-03-06' (vì +7 = ngày hôm sau)
 */
export function formatVnDateISO(input: Date | string | number | null | undefined): string {
    if (!input) return 'unknown-date'
    try {
        const vn = toVietnamDate(input)
        const year = vn.getUTCFullYear()
        const month = pad(vn.getUTCMonth() + 1)
        const day = pad(vn.getUTCDate())
        return `${year}-${month}-${day}`
    } catch {
        return 'unknown-date'
    }
}

/**
 * Format time sang dạng HH:mm (giờ Việt Nam)
 * Hỗ trợ cả Date object, ISO string, và chuỗi "HH:mm" / "HH:mm:ss"
 *
 * @example
 * formatVnTime('2026-03-05T10:30:00Z') // '17:30'
 * formatVnTime('14:30')                // '14:30' (giữ nguyên nếu đã là chuỗi giờ)
 */
export function formatVnTime(input: Date | string | number | null | undefined): string {
    if (!input) return 'N/A'
    try {
        // Nếu là chuỗi dạng "HH:mm" hoặc "HH:mm:ss" → giữ nguyên
        if (typeof input === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(input)) {
            const [hour, minute] = input.split(':').map(Number)
            return `${pad(hour)}:${pad(minute)}`
        }

        const vn = toVietnamDate(input)
        return `${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}`
    } catch {
        return String(input)
    }
}

/**
 * Format datetime sang dạng HH:mm dd/MM/yyyy (giờ Việt Nam)
 *
 * @example
 * formatVnDateTime('2026-03-05T10:30:00Z') // '17:30 05/03/2026'
 */
export function formatVnDateTime(input: Date | string | number | null | undefined): string {
    if (!input) return 'N/A'
    try {
        const vn = toVietnamDate(input)
        const time = `${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}`
        const day = pad(vn.getUTCDate())
        const month = pad(vn.getUTCMonth() + 1)
        const year = vn.getUTCFullYear()
        return `${time} ${day}/${month}/${year}`
    } catch {
        return String(input)
    }
}

/**
 * Format datetime sang dạng HH:mm:ss dd/MM/yyyy (giờ Việt Nam)
 *
 * @example
 * formatVnDateTimeFull('2026-03-05T10:30:45Z') // '17:30:45 05/03/2026'
 */
export function formatVnDateTimeFull(input: Date | string | number | null | undefined): string {
    if (!input) return 'N/A'
    try {
        const vn = toVietnamDate(input)
        const time = `${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}:${pad(vn.getUTCSeconds())}`
        const day = pad(vn.getUTCDate())
        const month = pad(vn.getUTCMonth() + 1)
        const year = vn.getUTCFullYear()
        return `${time} ${day}/${month}/${year}`
    } catch {
        return String(input)
    }
}
