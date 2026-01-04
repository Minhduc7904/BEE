import { Transform } from 'class-transformer'

/**
 * Decorator chuyển đổi string thành boolean
 * Sử dụng cho query parameters từ URL
 * - "true" -> true
 * - "false" -> false
 * - boolean -> giữ nguyên
 * - khác -> undefined
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    if (typeof value === 'boolean') return value
    return undefined
  })
}
