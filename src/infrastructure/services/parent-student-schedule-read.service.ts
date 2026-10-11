import { Injectable } from '@nestjs/common'
import { AttendanceStatus as PrismaAttendanceStatus, AttendanceType as PrismaAttendanceType } from '@prisma/client'

import { ParentScheduleSession, ParentStudentScheduleReadService } from '../../application/interfaces'
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum'
import { AttendanceType } from '../../shared/enums/attendance-type.enum'
import { PrismaService } from '../../prisma/prisma.service'

const attendanceStatusMap: Record<PrismaAttendanceStatus, AttendanceStatus> = {
  [PrismaAttendanceStatus.PRESENT]: AttendanceStatus.PRESENT,
  [PrismaAttendanceStatus.ABSENT]: AttendanceStatus.ABSENT,
  [PrismaAttendanceStatus.LATE]: AttendanceStatus.LATE,
}

const attendanceTypeMap: Record<PrismaAttendanceType, AttendanceType> = {
  [PrismaAttendanceType.REGULAR]: AttendanceType.REGULAR,
  [PrismaAttendanceType.MAKEUP]: AttendanceType.MAKEUP,
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
        OR: [
          { courseClass: { classStudents: { some: { studentId } } } },
          // Học sinh có thể được điểm danh học bù ở một lớp chưa tham gia.
          // Giữ session đó trong lịch nhưng vẫn chỉ lấy Attendance của em này.
          { attendances: { some: { studentId } } },
        ],
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
            attendanceType: true,
            markedAt: true,
            notes: true,
          },
        },
      },
    })

    return rows.map((row) => {
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
              attendanceType: attendanceTypeMap[attendance.attendanceType],
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
    })
  }
}
