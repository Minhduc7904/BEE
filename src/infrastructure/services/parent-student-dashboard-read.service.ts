import { Injectable } from '@nestjs/common'
import {
  AttendanceStatus as PrismaAttendanceStatus,
  AttendanceType as PrismaAttendanceType,
  TuitionPaymentStatus,
} from '@prisma/client'

import {
  ParentAttendanceStatusCounts,
  ParentStudentDashboardReadService,
  ParentUnpaidTuitionPayment,
} from '../../application/interfaces'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaParentStudentDashboardReadService extends ParentStudentDashboardReadService {
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

  async countAttendanceByStatus(
    studentId: number,
    from: Date,
    toExclusive: Date,
  ): Promise<ParentAttendanceStatusCounts> {
    const groups = await this.prisma.attendance.groupBy({
      by: ['status', 'attendanceType'],
      where: {
        studentId,
        classSession: { sessionDate: { gte: from, lt: toExclusive } },
        // Buổi vắng đã được học bù (cùng điều kiện isMadeUp của lịch phụ huynh) không tính vào thống kê;
        // bản ghi học bù của nó đã được đếm ở present/late.
        NOT: {
          status: PrismaAttendanceStatus.ABSENT,
          makeupByAttendanceId: { not: null },
          makeupBy: { isNot: null },
        },
      },
      _count: { _all: true },
    })
    const countWhere = (predicate: (group: (typeof groups)[number]) => boolean): number =>
      groups.filter(predicate).reduce((sum, group) => sum + group._count._all, 0)
    const countOf = (status: PrismaAttendanceStatus): number => countWhere((group) => group.status === status)

    return {
      present: countOf(PrismaAttendanceStatus.PRESENT),
      absent: countOf(PrismaAttendanceStatus.ABSENT),
      late: countOf(PrismaAttendanceStatus.LATE),
      // Học bù là tập con của trạng thái Có mặt/Muộn, không phải trạng thái thứ tư.
      makeup: countWhere((group) => group.attendanceType === PrismaAttendanceType.MAKEUP),
    }
  }

  async listUnpaidTuitionPayments(studentId: number): Promise<ParentUnpaidTuitionPayment[]> {
    return this.prisma.tuitionPayment.findMany({
      where: { studentId, status: TuitionPaymentStatus.UNPAID },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { paymentId: 'asc' }],
      select: { paymentId: true, amount: true, month: true, year: true },
    })
  }
}
