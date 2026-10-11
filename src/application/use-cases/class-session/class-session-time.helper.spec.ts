import { getClassSessionInstant, getSessionNotificationMoments } from './class-session-time.helper'

const date = (value: string) => new Date(`${value}T00:00:00.000Z`)
const time = (value: string) => new Date(`1970-01-01T${value}:00.000Z`)

describe('class-session-time.helper', () => {
  it('ghép ngày VN với giờ VN (11:00 UTC = 18:00 VN cùng ngày)', () => {
    expect(getClassSessionInstant(date('2026-10-14'), time('11:00')).toISOString()).toBe('2026-10-14T11:00:00.000Z')
  })

  it('buổi trước 07:00 sáng giờ VN: giờ UTC rơi vào hôm trước nhưng vẫn đúng ngày VN', () => {
    // 05:30 VN ngày 14/10 = 22:30 UTC ngày 13/10
    expect(getClassSessionInstant(date('2026-10-14'), time('22:30')).toISOString()).toBe('2026-10-13T22:30:00.000Z')
  })

  it('buổi lúc 07:00 VN đúng nửa đêm UTC', () => {
    expect(getClassSessionInstant(date('2026-10-14'), time('00:00')).toISOString()).toBe('2026-10-14T00:00:00.000Z')
  })

  it('buổi cuối ngày 23:30 VN (16:30 UTC)', () => {
    expect(getClassSessionInstant(date('2026-10-14'), time('16:30')).toISOString()).toBe('2026-10-14T16:30:00.000Z')
  })

  it('tính hai mốc: start + 15 phút và hết giờ', () => {
    const moments = getSessionNotificationMoments({
      sessionDate: date('2026-10-14'),
      startTime: time('11:00'),
      endTime: time('13:00'),
    })
    expect(moments.reminderAt.toISOString()).toBe('2026-10-14T11:15:00.000Z')
    expect(moments.summaryAt.toISOString()).toBe('2026-10-14T13:00:00.000Z')
  })

  it('mốc 15 phút của buổi 06:50 VN qua nửa đêm UTC vẫn đúng', () => {
    // 06:50 VN = 23:50 UTC hôm trước
    const moments = getSessionNotificationMoments({
      sessionDate: date('2026-10-14'),
      startTime: time('23:50'),
      endTime: time('01:00'),
    })
    expect(moments.reminderAt.toISOString()).toBe('2026-10-14T00:05:00.000Z')
    expect(moments.summaryAt.toISOString()).toBe('2026-10-14T01:00:00.000Z')
  })
})
