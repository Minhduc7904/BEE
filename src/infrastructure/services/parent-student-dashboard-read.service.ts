import { Injectable } from '@nestjs/common'
import { AttendanceStatus as PrismaAttendanceStatus, TuitionPaymentStatus } from '@prisma/client'

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
      by: ['status'],
      where: {
        studentId,
        classSession: { sessionDate: { gte: from, lt: toExclusive } },
      },
      _count: { _all: true },
    })
    const countOf = (status: PrismaAttendanceStatus): number =>
      groups.find((group) => group.status === status)?._count._all ?? 0

    return {
      present: countOf(PrismaAttendanceStatus.PRESENT),
      absent: countOf(PrismaAttendanceStatus.ABSENT),
      late: countOf(PrismaAttendanceStatus.LATE),
      makeup: countOf(PrismaAttendanceStatus.MAKEUP),
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
