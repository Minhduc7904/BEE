import { resolveScheduleWeek } from '../parent-student-schedule/parent-student-schedule-week'
import { buildCourseClassMakeupSessionsResponse, MakeupSessionSource } from './course-class-makeup-sessions.helper'

// Tuần Thứ Hai 12/10/2026 đến Chủ Nhật 18/10/2026.
const week = resolveScheduleWeek('2026-10-12')
const group = { groupId: 5, memberClassIds: [10, 11, 12] }
const classNameById = new Map([
  [10, 'Toán 10A'],
  [11, 'Toán 10B'],
  [12, 'Toán 10C'],
  [99, 'Lớp ngoài nhóm'],
])

const session = (
  sessionId: number,
  classId: number,
  date: string,
  startTime = '18:00:00',
  name = `Buổi ${sessionId}`,
): MakeupSessionSource => ({
  sessionId,
  classId,
  name,
  sessionDate: new Date(`${date}T00:00:00.000Z`),
  startTime: new Date(`1970-01-01T${startTime}.000Z`),
  endTime: new Date('1970-01-01T20:00:00.000Z'),
})

const build = (sessions: MakeupSessionSource[], overrides: { group?: typeof group | null } = {}) =>
  buildCourseClassMakeupSessionsResponse({
    sourceClassId: 10,
    courseId: 3,
    group: overrides.group === undefined ? group : overrides.group,
    week,
    sessions,
    classNameById,
  })

describe('buildCourseClassMakeupSessionsResponse', () => {
  it('lớp chưa thuộc nhóm hiệu lực: groupId null và không có buổi nào', () => {
    const response = build([session(1, 10, '2026-10-13')], { group: null })

    expect(response).toMatchObject({
      sourceClassId: 10,
      courseId: 3,
      groupId: null,
      weekStart: '2026-10-12',
      weekEnd: '2026-10-18',
      sessions: [],
    })
  })

  it('ghép buổi của lớp nguồn với buổi của các lớp bạn cùng tuần, sắp theo ngày rồi giờ', () => {
    const response = build([
      session(4, 12, '2026-10-16', '18:00:00'),
      session(3, 11, '2026-10-14', '19:00:00'),
      session(2, 11, '2026-10-14', '08:00:00'),
      session(1, 10, '2026-10-13', '18:00:00', 'Buổi 13/10'),
    ])

    expect(response.groupId).toBe(5)
    expect(response.sessions).toHaveLength(1)
    expect(response.sessions[0]).toMatchObject({
      sessionId: 1,
      classId: 10,
      className: 'Toán 10A',
      name: 'Buổi 13/10',
      sessionDate: '2026-10-13',
    })
    expect(response.sessions[0].makeupCandidates.map((candidate) => candidate.sessionId)).toEqual([2, 3, 4])
    expect(response.sessions[0].makeupCandidates.map((candidate) => candidate.className)).toEqual([
      'Toán 10B',
      'Toán 10B',
      'Toán 10C',
    ])
  })

  it('mỗi buổi của lớp nguồn đều nhận cùng tập buổi của lớp bạn trong tuần', () => {
    const response = build([session(1, 10, '2026-10-13'), session(2, 10, '2026-10-15'), session(3, 11, '2026-10-14')])

    expect(response.sessions.map((item) => item.sessionId)).toEqual([1, 2])
    for (const item of response.sessions) {
      expect(item.makeupCandidates.map((candidate) => candidate.sessionId)).toEqual([3])
    }
  })

  it('buổi ngoài tuần không bao giờ ghép được với nhau', () => {
    const response = build([
      session(1, 10, '2026-10-13'),
      session(2, 11, '2026-10-11'), // Chủ Nhật tuần trước
      session(3, 11, '2026-10-19'), // Thứ Hai tuần sau
      session(4, 10, '2026-10-19'),
    ])

    expect(response.sessions.map((item) => item.sessionId)).toEqual([1])
    expect(response.sessions[0].makeupCandidates).toEqual([])
  })

  it('tính cả hai biên của tuần: Thứ Hai đầu tuần và Chủ Nhật cuối tuần', () => {
    const response = build([session(1, 10, '2026-10-12'), session(2, 11, '2026-10-18')])

    expect(response.sessions.map((item) => item.sessionId)).toEqual([1])
    expect(response.sessions[0].makeupCandidates.map((candidate) => candidate.sessionId)).toEqual([2])
  })

  it('lớp ngoài nhóm bị loại dù cùng tuần', () => {
    const response = build([session(1, 10, '2026-10-13'), session(2, 99, '2026-10-13')])

    expect(response.sessions[0].makeupCandidates).toEqual([])
  })

  it('lớp nguồn không có buổi nào trong tuần thì danh sách rỗng dù lớp bạn có buổi', () => {
    const response = build([session(2, 11, '2026-10-13')])

    expect(response.groupId).toBe(5)
    expect(response.sessions).toEqual([])
  })

  it('thiếu tên lớp trong map thì dùng nhãn dự phòng', () => {
    const response = buildCourseClassMakeupSessionsResponse({
      sourceClassId: 10,
      courseId: 3,
      group,
      week,
      sessions: [session(1, 10, '2026-10-13')],
      classNameById: new Map(),
    })

    expect(response.sessions[0].className).toBe('Lớp #10')
  })
})
