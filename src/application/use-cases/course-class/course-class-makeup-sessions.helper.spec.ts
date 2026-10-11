import { resolveScheduleWeek } from '../parent-student-schedule/parent-student-schedule-week'
import { buildCourseClassMakeupSessionsResponse, MakeupSessionSource } from './course-class-makeup-sessions.helper'

// Tuần Thứ Hai 12/10/2026 đến Chủ Nhật 18/10/2026.
const week = resolveScheduleWeek('2026-10-12')
const classNameById = new Map([
  [10, 'Toán 10A'],
  [11, 'Toán 10B'],
  [12, 'Toán 10C'],
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

const build = (
  sourceSessions: MakeupSessionSource[],
  makeupSessionsBySessionId: Map<number, MakeupSessionSource[]> = new Map(),
  overrides: { groupId?: number | null } = {},
) =>
  buildCourseClassMakeupSessionsResponse({
    sourceClassId: 10,
    courseId: 3,
    groupId: overrides.groupId === undefined ? 5 : overrides.groupId,
    week,
    sourceSessions,
    makeupSessionsBySessionId,
    classNameById,
  })

describe('buildCourseClassMakeupSessionsResponse', () => {
  it('lớp chưa thuộc nhóm hiệu lực: groupId null và không có buổi nào', () => {
    const response = build([session(1, 10, '2026-10-13')], new Map(), { groupId: null })

    expect(response).toMatchObject({
      sourceClassId: 10,
      courseId: 3,
      groupId: null,
      weekStart: '2026-10-12',
      weekEnd: '2026-10-18',
      sessions: [],
    })
  })

  it('gắn các buổi học bù đọc từ bảng cho từng buổi của lớp nguồn, sắp theo ngày rồi giờ', () => {
    const response = build(
      [session(1, 10, '2026-10-13', '18:00:00', 'Buổi 13/10')],
      new Map([
        [
          1,
          [
            session(4, 12, '2026-10-16', '18:00:00'),
            session(3, 11, '2026-10-14', '19:00:00'),
            session(2, 11, '2026-10-14', '08:00:00'),
          ],
        ],
      ]),
    )

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

  it('mỗi buổi của lớp nguồn chỉ nhận các buổi học bù của riêng nó', () => {
    const response = build(
      [session(2, 10, '2026-10-15'), session(1, 10, '2026-10-13')],
      new Map([
        [1, [session(3, 11, '2026-10-14')]],
        [2, [session(4, 11, '2026-10-16')]],
      ]),
    )

    expect(response.sessions.map((item) => item.sessionId)).toEqual([1, 2])
    expect(response.sessions[0].makeupCandidates.map((candidate) => candidate.sessionId)).toEqual([3])
    expect(response.sessions[1].makeupCandidates.map((candidate) => candidate.sessionId)).toEqual([4])
  })

  it('buổi chưa có cặp nào trong bảng thì danh sách buổi học bù rỗng', () => {
    const response = build([session(1, 10, '2026-10-13')])

    expect(response.sessions).toHaveLength(1)
    expect(response.sessions[0].makeupCandidates).toEqual([])
  })

  it('lớp nguồn không có buổi nào trong tuần thì danh sách rỗng', () => {
    const response = build([])

    expect(response.groupId).toBe(5)
    expect(response.sessions).toEqual([])
  })

  it('thiếu tên lớp trong map thì dùng nhãn dự phòng', () => {
    const response = buildCourseClassMakeupSessionsResponse({
      sourceClassId: 10,
      courseId: 3,
      groupId: 5,
      week,
      sourceSessions: [session(1, 10, '2026-10-13')],
      makeupSessionsBySessionId: new Map(),
      classNameById: new Map(),
    })

    expect(response.sessions[0].className).toBe('Lớp #10')
  })
})
