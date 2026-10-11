import {
  buildMakeupPairs,
  getWeekEnd,
  getWeekStart,
  getWeekStartKey,
  type MakeupPairSessionSource,
} from './session-makeup-registration.helper'

const session = (sessionId: number, classId: number, date: string): MakeupPairSessionSource => ({
  sessionId,
  classId,
  sessionDate: new Date(`${date}T00:00:00.000Z`),
})

const sortPairs = (pairs: Array<{ sessionId: number; makeupSessionId: number }>) =>
  [...pairs].sort((a, b) => a.sessionId - b.sessionId || a.makeupSessionId - b.makeupSessionId)

describe('getWeekStartKey', () => {
  it('trả Thứ Hai của tuần cho mọi ngày từ Thứ Hai đến Chủ Nhật', () => {
    for (const day of [
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]) {
      expect(getWeekStartKey(new Date(`${day}T00:00:00.000Z`))).toBe('2026-10-12')
    }
  })

  it('biên Chủ Nhật thuộc tuần cũ và Thứ Hai kế tiếp thuộc tuần mới', () => {
    expect(getWeekStartKey(new Date('2026-10-18T00:00:00.000Z'))).toBe('2026-10-12')
    expect(getWeekStartKey(new Date('2026-10-19T00:00:00.000Z'))).toBe('2026-10-19')
  })

  it('getWeekStart và getWeekEnd trả Thứ Hai và Chủ Nhật của tuần', () => {
    const date = new Date('2026-10-15T00:00:00.000Z')

    expect(getWeekStart(date).toISOString()).toBe('2026-10-12T00:00:00.000Z')
    expect(getWeekEnd(date).toISOString()).toBe('2026-10-18T00:00:00.000Z')
  })
})

describe('buildMakeupPairs', () => {
  const groups = new Map([
    [10, 5],
    [11, 5],
    [12, 5],
  ])

  it('tạo cặp hai chiều giữa buổi khác lớp, cùng nhóm, cùng tuần', () => {
    const pairs = buildMakeupPairs([session(1, 10, '2026-10-13'), session(2, 11, '2026-10-15')], groups)

    expect(sortPairs(pairs)).toEqual([
      { sessionId: 1, makeupSessionId: 2 },
      { sessionId: 2, makeupSessionId: 1 },
    ])
  })

  it('ghép mọi buổi của các lớp khác nhau trong cùng nhóm và tuần', () => {
    const pairs = buildMakeupPairs(
      [session(1, 10, '2026-10-13'), session(2, 11, '2026-10-14'), session(3, 12, '2026-10-16')],
      groups,
    )

    expect(pairs).toHaveLength(6)
  })

  it('không ghép hai buổi cùng lớp', () => {
    const pairs = buildMakeupPairs([session(1, 10, '2026-10-13'), session(2, 10, '2026-10-15')], groups)

    expect(pairs).toEqual([])
  })

  it('không ghép buổi của lớp khác nhóm hoặc lớp không thuộc nhóm nào', () => {
    const pairs = buildMakeupPairs(
      [session(1, 10, '2026-10-13'), session(2, 20, '2026-10-13'), session(3, 30, '2026-10-13')],
      new Map([
        [10, 5],
        [20, 6],
      ]),
    )

    expect(pairs).toEqual([])
  })

  it('không ghép buổi khác tuần, kể cả sát biên Chủ Nhật và Thứ Hai', () => {
    const pairs = buildMakeupPairs([session(1, 10, '2026-10-18'), session(2, 11, '2026-10-19')], groups)

    expect(pairs).toEqual([])
  })

  it('ghép buổi ở hai biên của cùng một tuần (Thứ Hai và Chủ Nhật)', () => {
    const pairs = buildMakeupPairs([session(1, 10, '2026-10-12'), session(2, 11, '2026-10-18')], groups)

    expect(sortPairs(pairs)).toEqual([
      { sessionId: 1, makeupSessionId: 2 },
      { sessionId: 2, makeupSessionId: 1 },
    ])
  })

  it('lớp chưa nằm trong map nhóm hiệu lực (nhóm dưới 2 lớp) không tạo cặp', () => {
    const pairs = buildMakeupPairs([session(1, 10, '2026-10-13'), session(2, 11, '2026-10-13')], new Map())

    expect(pairs).toEqual([])
  })
})
