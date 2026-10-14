import {
  AttendanceStatus as PrismaAttendanceStatus,
  AttendanceType as PrismaAttendanceType,
  Prisma,
} from '@prisma/client'

import type { ParentScheduleAttendance } from '../../application/interfaces'
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum'
import { AttendanceType } from '../../shared/enums/attendance-type.enum'

const attendanceStatusMap: Record<PrismaAttendanceStatus, AttendanceStatus> = {
  [PrismaAttendanceStatus.PRESENT]: AttendanceStatus.PRESENT,
  [PrismaAttendanceStatus.ABSENT]: AttendanceStatus.ABSENT,
  [PrismaAttendanceStatus.LATE]: AttendanceStatus.LATE,
}

const attendanceTypeMap: Record<PrismaAttendanceType, AttendanceType> = {
  [PrismaAttendanceType.REGULAR]: AttendanceType.REGULAR,
  [PrismaAttendanceType.MAKEUP]: AttendanceType.MAKEUP,
}

/** Bản ghi học bù mà một bản ghi Vắng trỏ tới (`makeupBy`), kèm buổi và lớp để hiển thị "Đã học bù". */
export const parentAttendanceMakeupBySelect = {
  attendanceId: true,
  sessionId: true,
  classSession: {
    select: {
      classId: true,
      sessionDate: true,
      startTime: true,
      endTime: true,
      courseClass: { select: { className: true } },
    },
  },
} satisfies Prisma.AttendanceSelect

/** Các cột Attendance mà mọi API lịch phụ huynh cần, gồm quan hệ makeupBy. */
export const parentAttendanceSelect = {
  attendanceId: true,
  status: true,
  attendanceType: true,
  makeupByAttendanceId: true,
  makeupBy: { select: parentAttendanceMakeupBySelect },
  markedAt: true,
  notes: true,
} satisfies Prisma.AttendanceSelect

export type ParentAttendanceRow = Prisma.AttendanceGetPayload<{ select: typeof parentAttendanceSelect }>

/**
 * `isMadeUp` chỉ đúng khi bản ghi là Vắng và đã có liên kết; không suy ra từ `attendanceType` hay `makeupNote`.
 */
export function toParentScheduleAttendance(row: ParentAttendanceRow): ParentScheduleAttendance {
  const status = attendanceStatusMap[row.status]
  const makeupBy = row.makeupBy
  const linked = status === AttendanceStatus.ABSENT && row.makeupByAttendanceId !== null && makeupBy !== null

  return {
    attendanceId: row.attendanceId,
    status,
    attendanceType: attendanceTypeMap[row.attendanceType],
    makeupByAttendanceId: row.makeupByAttendanceId,
    isMadeUp: linked,
    makeupBy: linked
      ? {
          attendanceId: makeupBy.attendanceId,
          sessionId: makeupBy.sessionId,
          classId: makeupBy.classSession.classId,
          className: makeupBy.classSession.courseClass.className,
          sessionDate: makeupBy.classSession.sessionDate,
          startTime: makeupBy.classSession.startTime,
          endTime: makeupBy.classSession.endTime,
        }
      : null,
    markedAt: row.markedAt,
    notes: row.notes || null,
  }
}
