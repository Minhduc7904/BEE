import { getMonthDateOnlyRange, getVietnamMonthEnd, getVietnamMonthRange } from './vietnam-month.util'

describe('Vietnam month ranges', () => {
  it('maps the Vietnam month to [start, next start) in UTC', () => {
    const range = getVietnamMonthRange(10, 2026)

    expect(range.start.toISOString()).toBe('2026-09-30T17:00:00.000Z')
    expect(range.endExclusive.toISOString()).toBe('2026-10-31T17:00:00.000Z')
  })

  it('treats the last Vietnam millisecond of the month as inside and the next as outside', () => {
    const { start, endExclusive } = getVietnamMonthRange(10, 2026)
    const inside = (value: string) => {
      const time = new Date(value).getTime()
      return time >= start.getTime() && time < endExclusive.getTime()
    }

    expect(inside('2026-09-30T16:59:59.999Z')).toBe(false) // 23:59:59.999 ngày 30/09 giờ VN
    expect(inside('2026-09-30T17:00:00.000Z')).toBe(true) // 00:00 ngày 01/10 giờ VN
    expect(inside('2026-10-31T16:59:59.999Z')).toBe(true) // 23:59:59.999 ngày 31/10 giờ VN
    expect(inside('2026-10-31T17:00:00.000Z')).toBe(false) // 00:00 ngày 01/11 giờ VN
  })

  it('rolls December into January of the next year', () => {
    const range = getVietnamMonthRange(12, 2026)

    expect(range.start.toISOString()).toBe('2026-11-30T17:00:00.000Z')
    expect(range.endExclusive.toISOString()).toBe('2026-12-31T17:00:00.000Z')
  })

  it.each([
    [9, 2026, '2026-09-30T16:59:59.999Z'],
    [2, 2028, '2028-02-29T16:59:59.999Z'],
    [2, 2026, '2026-02-28T16:59:59.999Z'],
    [12, 2026, '2026-12-31T16:59:59.999Z'],
  ])('ends month %i/%i at 23:59:59.999 Vietnam time', (month, year, expected) => {
    expect(getVietnamMonthEnd(month, year).toISOString()).toBe(expected)
  })

  it('uses UTC-midnight calendar bounds for date-only columns', () => {
    const range = getMonthDateOnlyRange(10, 2026)

    expect(range.from.toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(range.toExclusive.toISOString()).toBe('2026-11-01T00:00:00.000Z')
  })
})
