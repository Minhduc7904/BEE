import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import {
  ParentNextScheduleClass,
  ParentNextScheduleSession,
  ParentScheduleClock,
  ParentScheduleSession,
  ParentStudentScheduleReadService,
} from '../../application/interfaces'
import { PrismaService } from '../../prisma/prisma.service'
import { parentAttendanceSelect, toParentScheduleAttendance } from './parent-schedule-attendance.mapper'

function parentSessionSelect(studentId: number) {
  return {
    sessionId: true,
    classId: true,
    name: true,
    sessionDate: true,
    startTime: true,
    endTime: true,
    makeupNote: true,
    homeworkId: true,
    homeworkContent: {
      select: {
        homeworkSubmits: {
          where: { studentId },
          take: 1,
          select: {
            homeworkSubmitId: true,
            points: true,
          },
        },
      },
    },
    courseClass: {
      select: {
        className: true,
        room: true,
        instructor: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    },
    attendances: {
      where: { studentId },
      take: 1,
      select: parentAttendanceSelect,
    },
  } satisfies Prisma.ClassSessionSelect
}

/** Như `parentSessionSelect` nhưng kèm lịch tuần và ngày bắt đầu/kết thúc của lớp cho card "Buổi học tiếp theo". */
function parentNextSessionSelect(studentId: number) {
  const base = parentSessionSelect(studentId)

  return {
    ...base,
    courseClass: {
      select: {
        ...base.courseClass.select,
        weeklySchedule: true,
        startDate: true,
        endDate: true,
      },
    },
  } satisfies Prisma.ClassSessionSelect
}

/**
 * Buổi học thuộc phạm vi của học sinh: lớp em đang học, hoặc buổi học bù ở lớp
 * khác mà em đã được điểm danh. Luôn chỉ lấy Attendance của chính em này.
 */
function studentSessionScope(studentId: number) {
  return {
    OR: [{ courseClass: { classStudents: { some: { studentId } } } }, { attendances: { some: { studentId } } }],
  } satisfies Prisma.ClassSessionWhereInput
}

type ParentSessionRow = Prisma.ClassSessionGetPayload<{ select: ReturnType<typeof parentSessionSelect> }>
type ParentNextSessionRow = Prisma.ClassSessionGetPayload<{ select: ReturnType<typeof parentNextSessionSelect> }>

@Injectable()
export class PrismaParentStudentScheduleReadService extends ParentStudentScheduleReadService {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async isStudentLinked(parentId: number, studentId: number): Promise<boolean> {
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
      select: { studentId: true },
    })
    return link !== null
  }

  async listSessionsInRange(studentId: number, from: Date, to: Date): Promise<ParentScheduleSession[]> {
    const rows = await this.prisma.classSession.findMany({
      where: {
        sessionDate: { gte: from, lte: to },
        ...studentSessionScope(studentId),
      },
      orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }, { sessionId: 'asc' }],
      select: parentSessionSelect(studentId),
    })

    return rows.map((row) => this.toSession(row))
  }

  async findNextSession(studentId: number, clock: ParentScheduleClock): Promise<ParentNextScheduleSession | null> {
    const row = await this.prisma.classSession.findFirst({
      where: {
        AND: [
          // Cùng phạm vi với lịch tuần: lớp học sinh đang học, hoặc buổi học bù ở lớp khác đã có điểm danh.
          studentSessionScope(studentId),
          {
            OR: [{ sessionDate: { gt: clock.today } }, { sessionDate: clock.today, endTime: { gt: clock.timeOfDay } }],
          },
        ],
      },
      // Buổi đang diễn ra đã bắt đầu nên luôn đứng trước mọi buổi tương lai; không có thì lấy buổi gần nhất.
      orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }, { sessionId: 'asc' }],
      select: parentNextSessionSelect(studentId),
    })

    return row ? this.toNextSession(row) : null
  }

  async listNonEndedEnrolledClasses(studentId: number, today: Date): Promise<ParentNextScheduleClass[]> {
    const rows = await this.prisma.courseClass.findMany({
      where: {
        // Chỉ lớp có ClassStudent của học sinh; buổi học bù ở lớp khác không làm lớp đó thành lớp dự phòng.
        classStudents: { some: { studentId } },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      orderBy: [{ classId: 'asc' }],
      select: {
        classId: true,
        className: true,
        weeklySchedule: true,
        startDate: true,
        endDate: true,
        room: true,
        instructor: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    })

    return rows.map((row) => {
      const instructorUser = row.instructor?.user
      const instructorName = instructorUser ? `${instructorUser.lastName} ${instructorUser.firstName}`.trim() : ''

      return {
        classId: row.classId,
        className: row.className,
        weeklySchedule: row.weeklySchedule || null,
        classStartDate: row.startDate,
        classEndDate: row.endDate,
        room: row.room || null,
        instructorName: instructorName || null,
      }
    })
  }

  private toNextSession(row: ParentNextSessionRow): ParentNextScheduleSession {
    return {
      ...this.toSession(row),
      classWeeklySchedule: row.courseClass.weeklySchedule || null,
      classStartDate: row.courseClass.startDate,
      classEndDate: row.courseClass.endDate,
    }
  }

  private toSession(row: ParentSessionRow): ParentScheduleSession {
    const attendance = row.attendances[0]
    const homeworkSubmit = row.homeworkContent?.homeworkSubmits[0]
    const instructorUser = row.courseClass.instructor?.user
    const instructorName = instructorUser ? `${instructorUser.lastName} ${instructorUser.firstName}`.trim() : ''

    return {
      sessionId: row.sessionId,
      classId: row.classId,
      name: row.name,
      sessionDate: row.sessionDate,
      startTime: row.startTime,
      endTime: row.endTime,
      className: row.courseClass.className,
      room: row.courseClass.room || null,
      instructorName: instructorName || null,
      makeupNote: row.makeupNote || null,
      attendance: attendance ? toParentScheduleAttendance(attendance) : null,
      homework:
        row.homeworkId === null
          ? null
          : {
              homeworkId: row.homeworkId,
              submission: homeworkSubmit
                ? {
                    homeworkSubmitId: homeworkSubmit.homeworkSubmitId,
                    points: homeworkSubmit.points,
                  }
                : null,
            },
    }
  }
}
