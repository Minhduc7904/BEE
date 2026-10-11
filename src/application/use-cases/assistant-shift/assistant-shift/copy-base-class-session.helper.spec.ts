import { buildClassSessionKey, buildClassSessionName, toClassSessionDate } from './copy-base-class-session.helper'

describe('copy-base-class-session.helper', () => {
  describe('buildClassSessionName', () => {
    it('đặt tên "Buổi dd/mm" theo ngày Việt Nam', () => {
      expect(buildClassSessionName(new Date('2026-10-12T00:00:00.000Z'))).toBe('Buổi 12/10')
    })

    it('ca 05:00 giờ VN (còn là ngày hôm trước theo UTC) vẫn thuộc ngày VN', () => {
      expect(buildClassSessionName(new Date('2026-10-11T22:00:00.000Z'))).toBe('Buổi 12/10')
    })

    it('đệm số 0 cho ngày và tháng một chữ số', () => {
      expect(buildClassSessionName(new Date('2026-03-04T03:00:00.000Z'))).toBe('Buổi 04/03')
    })
  })

  describe('toClassSessionDate', () => {
    it('trả nửa đêm UTC của ngày lịch Việt Nam', () => {
      expect(toClassSessionDate(new Date('2026-10-12T00:00:00.000Z')).toISOString()).toBe('2026-10-12T00:00:00.000Z')
    })

    it('ca 05:00 giờ VN không bị lùi sang ngày hôm trước', () => {
      expect(toClassSessionDate(new Date('2026-10-11T22:00:00.000Z')).toISOString()).toBe('2026-10-12T00:00:00.000Z')
    })

    it('ca 23:30 giờ VN vẫn giữ ngày VN', () => {
      expect(toClassSessionDate(new Date('2026-10-12T16:30:00.000Z')).toISOString()).toBe('2026-10-12T00:00:00.000Z')
    })

    it('ca 00:30 giờ VN thuộc ngày VN mới dù UTC còn là hôm trước', () => {
      expect(toClassSessionDate(new Date('2026-10-12T17:30:00.000Z')).toISOString()).toBe('2026-10-13T00:00:00.000Z')
    })
  })

  describe('buildClassSessionKey', () => {
    it('so khớp buổi sắp tạo với buổi đọc từ cột DATE/TIME', () => {
      const planned = buildClassSessionKey(
        10,
        toClassSessionDate(new Date('2026-10-12T00:00:00.000Z')),
        new Date('2026-10-12T00:00:00.000Z'),
      )
      const stored = buildClassSessionKey(
        10,
        new Date('2026-10-12T00:00:00.000Z'),
        new Date('1970-01-01T00:00:00.000Z'),
      )

      expect(planned).toBe(stored)
    })

    it('khác lớp, khác ngày hoặc khác giờ bắt đầu thì khóa khác nhau', () => {
      const date = new Date('2026-10-12T00:00:00.000Z')
      const time = new Date('1970-01-01T00:00:00.000Z')
      const base = buildClassSessionKey(10, date, time)

      expect(buildClassSessionKey(11, date, time)).not.toBe(base)
      expect(buildClassSessionKey(10, new Date('2026-10-13T00:00:00.000Z'), time)).not.toBe(base)
      expect(buildClassSessionKey(10, date, new Date('1970-01-01T01:00:00.000Z'))).not.toBe(base)
    })
  })
})
