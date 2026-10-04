import { Injectable } from '@nestjs/common'
import { AttendanceStatus as PrismaAttendanceStatus } from '@prisma/client'

import { ParentScheduleSession, ParentStudentScheduleReadService } from '../../application/interfaces'
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum'
import { PrismaService } from '../../prisma/prisma.service'

const attendanceStatusMap: Record<PrismaAttendanceStatus, AttendanceStatus> = {
  [PrismaAttendanceStatus.PRESENT]: AttendanceStatus.PRESENT,
  [PrismaAttendanceStatus.ABSENT]: AttendanceStatus.ABSENT,
  [PrismaAttendanceStatus.LATE]: AttendanceStatus.LATE,
  [PrismaAttendanceStatus.MAKEUP]: AttendanceStatus.MAKEUP,
}

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
        courseClass: { classStudents: { some: { studentId } } },
      },
      orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }, { sessionId: 'asc' }],
      select: {
        sessionId: true,
        classId: true,
        name: true,
        sessionDate: true,
        startTime: true,
        endTime: true,
        makeupNote: true,
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
      },
    })

    return rows.map((row) => {
      const attendance = row.attendances[0]
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
      }
    })
  }
}
