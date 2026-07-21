import { BadRequestException } from '@nestjs/common'

export const parseSepayTransactionDate = (value: string): Date => {
  const vietnamDateTime = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (vietnamDateTime) {
    const [, year, month, day, hour, minute, second] = vietnamDateTime
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 7, Number(minute), Number(second)),
    )
    const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    const isSameVietnamDateTime =
      !Number.isNaN(date.getTime()) &&
      vietnamTime.getUTCFullYear() === Number(year) &&
      vietnamTime.getUTCMonth() === Number(month) - 1 &&
      vietnamTime.getUTCDate() === Number(day) &&
      vietnamTime.getUTCHours() === Number(hour) &&
      vietnamTime.getUTCMinutes() === Number(minute) &&
      vietnamTime.getUTCSeconds() === Number(second)
    if (isSameVietnamDateTime) return date
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date

  throw new BadRequestException('Thời gian giao dịch SePay không hợp lệ')
}
