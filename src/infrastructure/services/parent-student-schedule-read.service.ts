import { Injectable } from '@nestjs/common'
import { AttendanceStatus as PrismaAttendanceStatus, Prisma } from '@prisma/client'

import {
  ParentScheduleClock,
  ParentScheduleSession,
  ParentStudentScheduleReadService,
} from '../../application/interfaces'
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum'
import { PrismaService } from '../../prisma/prisma.service'

const attendanceStatusMap: Record<PrismaAttendanceStatus, AttendanceStatus> = {
  [PrismaAttendanceStatus.PRESENT]: AttendanceStatus.PRESENT,
  [PrismaAttendanceStatus.ABSENT]: AttendanceStatus.ABSENT,
  [PrismaAttendanceStatus.LATE]: AttendanceStatus.LATE,
  [PrismaAttendanceStatus.MAKEUP]: AttendanceStatus.MAKEUP,
}

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
      select: {
        attendanceId: true,
        status: true,
        markedAt: true,
        notes: true,
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

  async findNextSession(studentId: number, clock: ParentScheduleClock): Promise<ParentScheduleSession | null> {
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
      select: parentSessionSelect(studentId),
    })

    return row ? this.toSession(row) : null
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
      attendance: attendance
        ? {
            attendanceId: attendance.attendanceId,
            status: attendanceStatusMap[attendance.status],
            markedAt: attendance.markedAt,
            notes: attendance.notes || null,
          }
        : null,
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
