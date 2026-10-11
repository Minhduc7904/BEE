import { PrismaParentScheduleSessionDetailReadService } from './parent-schedule-session-detail-read.service'
import type { PrismaService } from '../../prisma/prisma.service'

function admin(lastName: string, firstName: string) {
  return { user: { firstName, lastName } }
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 1330,
    classId: 152,
    name: 'Buổi 02/10',
    sessionDate: new Date('2026-10-02T00:00:00.000Z'),
    startTime: new Date('1970-01-01T11:00:00.000Z'),
    endTime: new Date('1970-01-01T13:00:00.000Z'),
    makeupNote: null,
    homeworkId: null,
    homeworkContent: null,
    attendances: [],
    courseClass: { className: 'Đại 1 lớp 11F', room: null, instructor: null, makeupGroupMember: null },
    ...overrides,
  }
}

function build(findFirst: jest.Mock) {
  return new PrismaParentScheduleSessionDetailReadService({
    classSession: { findFirst },
  } as unknown as PrismaService)
}

const today = new Date('2026-10-04T00:00:00.000Z')

describe('PrismaParentScheduleSessionDetailReadService', () => {
  it('issues one scoped query with student-only attendance, homework and non-expired makeup classes', async () => {
    const findFirst = jest.fn().mockResolvedValue(null)

    await build(findFirst).findSessionDetail(95, 1330, today)

    expect(findFirst).toHaveBeenCalledTimes(1)
    const args = findFirst.mock.calls[0][0]
    expect(args.where).toEqual({
      sessionId: 1330,
      OR: [
        { courseClass: { classStudents: { some: { studentId: 95 } } } },
        { attendances: { some: { studentId: 95 } } },
      ],
    })
    expect(args.select.attendances).toMatchObject({ where: { studentId: 95 }, take: 1 })
    expect(args.select.attendances.select.marker).toBeDefined()
    expect(args.select.homeworkContent.select.homeworkSubmits).toMatchObject({ where: { studentId: 95 }, take: 1 })
    expect(args.select.courseClass.select.makeupGroupMember.select.makeupGroup.select.members).toMatchObject({
      where: { courseClass: { OR: [{ endDate: null }, { endDate: { gte: today } }] } },
      orderBy: [{ courseClass: { className: 'asc' } }, { classId: 'asc' }],
    })
  })

  it('returns null when the session is missing or outside the student scope', async () => {
    await expect(build(jest.fn().mockResolvedValue(null)).findSessionDetail(95, 1, today)).resolves.toBeNull()
  })

  it('maps attendance null without inferring ABSENT, and blanks to null', async () => {
    const findFirst = jest.fn().mockResolvedValue(
      row({
        makeupNote: '',
        courseClass: { className: 'Lớp', room: '', instructor: admin('', ''), makeupGroupMember: null },
      }),
    )

    const item = await build(findFirst).findSessionDetail(95, 1330, today)

    expect(item).toMatchObject({
      attendance: null,
      room: null,
      instructorName: null,
      makeupNote: null,
      homework: null,
      makeupOptions: [],
    })
  })

  it('maps attendance with and without a marker', async () => {
    const markedAt = new Date('2026-10-02T06:10:00.000Z')
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce(
        row({
          attendances: [
            {
              attendanceId: 900,
              status: 'ABSENT',
              attendanceType: 'REGULAR',
              markedAt,
              notes: '',
              marker: admin('Nguyễn', 'Lan'),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        row({
          attendances: [
            { attendanceId: 901, status: 'LATE', attendanceType: 'MAKEUP', markedAt, notes: 'Đến trễ', marker: null },
          ],
        }),
      )
    const service = build(findFirst)

    const withMarker = await service.findSessionDetail(95, 1330, today)
    const withoutMarker = await service.findSessionDetail(95, 1330, today)

    expect(withMarker?.attendance).toEqual({
      attendanceId: 900,
      status: 'ABSENT',
      attendanceType: 'REGULAR',
      markedAt,
      notes: null,
      markerName: 'Nguyễn Lan',
    })
    expect(withoutMarker?.attendance).toEqual({
      attendanceId: 901,
      status: 'LATE',
      attendanceType: 'MAKEUP',
      markedAt,
      notes: 'Đến trễ',
      markerName: null,
    })
  })

  it.each(['PRESENT', 'ABSENT', 'LATE'])('maps attendance status %s', async (status) => {
    const findFirst = jest.fn().mockResolvedValue(
      row({
        attendances: [
          { attendanceId: 1, status, attendanceType: 'REGULAR', markedAt: new Date(), notes: null, marker: null },
        ],
      }),
    )

    const item = await build(findFirst).findSessionDetail(95, 1330, today)

    expect(item?.attendance?.status).toBe(status)
  })

  it('distinguishes unassigned, not submitted, ungraded and graded homework', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(row({ homeworkId: 20, homeworkContent: { homeworkSubmits: [] } }))
      .mockResolvedValueOnce(
        row({ homeworkId: 21, homeworkContent: { homeworkSubmits: [{ homeworkSubmitId: 31, points: null }] } }),
      )
      .mockResolvedValueOnce(
        row({ homeworkId: 22, homeworkContent: { homeworkSubmits: [{ homeworkSubmitId: 32, points: 8.5 }] } }),
      )
    const service = build(findFirst)

    const results = []
    for (let i = 0; i < 4; i++) {
      results.push((await service.findSessionDetail(95, 1330, today))?.homework)
    }

    expect(results).toEqual([
      null,
      { homeworkId: 20, submission: null },
      { homeworkId: 21, submission: { homeworkSubmitId: 31, points: null } },
      { homeworkId: 22, submission: { homeworkSubmitId: 32, points: 8.5 } },
    ])
  })

  it('maps the other classes in the makeup group with optional fields and instructor names', async () => {
    const findFirst = jest.fn().mockResolvedValue(
      row({
        courseClass: {
          className: 'Đại 1 lớp 11F',
          room: null,
          instructor: null,
          makeupGroupMember: {
            makeupGroup: {
              members: [
                {
                  // Chính lớp của buổi học nằm trong nhóm nhưng không được trả như lớp học bù.
                  courseClass: {
                    classId: 152,
                    className: 'Đại 1 lớp 11F',
                    startDate: null,
                    endDate: null,
                    weeklySchedule: null,
                    room: null,
                    instructor: null,
                  },
                },
                {
                  courseClass: {
                    classId: 153,
                    className: 'Đại 1 lớp 11G',
                    startDate: new Date('2026-09-01T00:00:00.000Z'),
                    endDate: new Date('2027-05-31T00:00:00.000Z'),
                    weeklySchedule: 'Thứ 7 - 08:00',
                    room: 'P305',
                    instructor: admin('Cô', 'Lan'),
                  },
                },
                {
                  courseClass: {
                    classId: 154,
                    className: 'Đại 1 lớp 11H',
                    startDate: null,
                    endDate: null,
                    weeklySchedule: null,
                    room: null,
                    instructor: null,
                  },
                },
              ],
            },
          },
        },
      }),
    )

    const item = await build(findFirst).findSessionDetail(95, 1330, today)

    expect(item?.makeupOptions).toEqual([
      {
        classId: 153,
        className: 'Đại 1 lớp 11G',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2027-05-31T00:00:00.000Z'),
        weeklySchedule: 'Thứ 7 - 08:00',
        room: 'P305',
        instructorName: 'Cô Lan',
      },
      {
        classId: 154,
        className: 'Đại 1 lớp 11H',
        startDate: null,
        endDate: null,
        weeklySchedule: null,
        room: null,
        instructorName: null,
      },
    ])
  })
})
