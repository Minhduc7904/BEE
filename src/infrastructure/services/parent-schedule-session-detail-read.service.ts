import { Injectable } from '@nestjs/common'
import { AttendanceStatus as PrismaAttendanceStatus, AttendanceType as PrismaAttendanceType } from '@prisma/client'

import { ParentScheduleSessionDetail, ParentScheduleSessionDetailReadService } from '../../application/interfaces'
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

const adminNameSelect = {
  user: { select: { firstName: true, lastName: true } },
} as const

function toDisplayName(admin: { user: { firstName: string; lastName: string } } | null | undefined): string | null {
  if (!admin) {
    return null
  }
  return `${admin.user.lastName} ${admin.user.firstName}`.trim() || null
}

@Injectable()
export class PrismaParentScheduleSessionDetailReadService extends ParentScheduleSessionDetailReadService {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findSessionDetail(
    studentId: number,
    sessionId: number,
    makeupEndDateFrom: Date,
  ): Promise<ParentScheduleSessionDetail | null> {
    const row = await this.prisma.classSession.findFirst({
      where: {
        sessionId,
        OR: [
          { courseClass: { classStudents: { some: { studentId } } } },
          // Học sinh có thể được điểm danh học bù ở một lớp chưa tham gia.
          { attendances: { some: { studentId } } },
        ],
      },
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
        attendances: {
          where: { studentId },
          take: 1,
          select: {
            attendanceId: true,
            status: true,
            attendanceType: true,
            markedAt: true,
            notes: true,
            marker: { select: adminNameSelect },
          },
        },
        courseClass: {
          select: {
            className: true,
            room: true,
            instructor: { select: adminNameSelect },
            // Nhóm học bù của lớp: các lớp còn lại trong nhóm (bỏ chính lớp này ở bước map) chưa kết thúc.
            makeupGroupMember: {
              select: {
                makeupGroup: {
                  select: {
                    members: {
                      where: {
                        courseClass: {
                          OR: [{ endDate: null }, { endDate: { gte: makeupEndDateFrom } }],
                        },
                      },
                      orderBy: [{ courseClass: { className: 'asc' } }, { classId: 'asc' }],
                      select: {
                        courseClass: {
                          select: {
                            classId: true,
                            className: true,
                            startDate: true,
                            endDate: true,
                            weeklySchedule: true,
                            room: true,
                            instructor: { select: adminNameSelect },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!row) {
      return null
    }

    const attendance = row.attendances[0]
    const homeworkSubmit = row.homeworkContent?.homeworkSubmits[0]

    return {
      sessionId: row.sessionId,
      classId: row.classId,
      name: row.name,
      sessionDate: row.sessionDate,
      startTime: row.startTime,
      endTime: row.endTime,
      className: row.courseClass.className,
      room: row.courseClass.room || null,
      instructorName: toDisplayName(row.courseClass.instructor),
      makeupNote: row.makeupNote || null,
      attendance: attendance
        ? {
            attendanceId: attendance.attendanceId,
            status: attendanceStatusMap[attendance.status],
            attendanceType: attendanceTypeMap[attendance.attendanceType],
            markedAt: attendance.markedAt,
            notes: attendance.notes || null,
            markerName: toDisplayName(attendance.marker),
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
      makeupOptions: (row.courseClass.makeupGroupMember?.makeupGroup.members ?? [])
        .filter(({ courseClass }) => courseClass.classId !== row.classId)
        .map(({ courseClass }) => ({
          classId: courseClass.classId,
          className: courseClass.className,
          startDate: courseClass.startDate,
          endDate: courseClass.endDate,
          weeklySchedule: courseClass.weeklySchedule || null,
          room: courseClass.room || null,
          instructorName: toDisplayName(courseClass.instructor),
        })),
    }
  }
}
