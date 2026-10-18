import { Injectable } from '@nestjs/common'
import { Prisma, TuitionPaymentStatus } from '@prisma/client'

import {
  PaymentAttemptStatus,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  TuitionPaymentStatus as DomainTuitionPaymentStatus,
} from '../../shared/enums'
import {
  encodeTuitionCursor,
  ParentStudentTuitionReadService,
  ParentTuitionPaymentDetailRecord,
  ParentTuitionPaymentListQuery,
  ParentTuitionPaymentPage,
  ParentTuitionPaymentRecord,
} from '../../application/interfaces'
import { PrismaService } from '../../prisma/prisma.service'

const paymentSelect = {
  paymentId: true,
  studentId: true,
  month: true,
  year: true,
  amount: true,
  status: true,
  paidAt: true,
  payerReportedTransferredAt: true,
} satisfies Prisma.TuitionPaymentSelect

@Injectable()
export class PrismaParentStudentTuitionReadService extends ParentStudentTuitionReadService {
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

  async listPayments(studentId: number, query: ParentTuitionPaymentListQuery): Promise<ParentTuitionPaymentPage> {
    // Hạn đóng là cuối tháng của kỳ nên thứ tự theo hạn chính là thứ tự (năm, tháng) – sắp xếp được ở SQL.
    const ascending = query.status === TuitionPaymentStatus.UNPAID
    const order: Prisma.SortOrder = ascending ? 'asc' : 'desc'
    const compare = ascending ? 'gt' : 'lt'
    const cursor = query.after
    const where: Prisma.TuitionPaymentWhereInput = {
      studentId,
      status: query.status as TuitionPaymentStatus,
      ...(cursor
        ? {
            OR: [
              { year: { [compare]: cursor.year } },
              { year: cursor.year, month: { [compare]: cursor.month } },
              { year: cursor.year, month: cursor.month, paymentId: { [compare]: cursor.paymentId } },
            ],
          }
        : {}),
    }

    const rows = await this.prisma.tuitionPayment.findMany({
      where,
      orderBy: [{ year: order }, { month: order }, { paymentId: order }],
      take: query.limit + 1,
      select: paymentSelect,
    })
    const hasNext = rows.length > query.limit
    const page = hasNext ? rows.slice(0, query.limit) : rows
    const last = page[page.length - 1]

    return {
      data: page.map((row) => this.toRecord(row)),
      hasNext,
      nextCursor:
        hasNext && last ? encodeTuitionCursor({ year: last.year, month: last.month, paymentId: last.paymentId }) : null,
    }
  }

  async findPaymentDetail(studentId: number, paymentId: number): Promise<ParentTuitionPaymentDetailRecord | null> {
    const row = await this.prisma.tuitionPayment.findFirst({
      where: { paymentId, studentId },
      select: {
        ...paymentSelect,
        paymentIntent: {
          select: {
            paymentIntentId: true,
            status: true,
            updatedAt: true,
            // Chỉ lấy các trường an toàn: không SePay payload, giao dịch ngân hàng hay ghi chú đối soát.
            attempts: {
              orderBy: [{ createdAt: 'desc' }, { paymentAttemptId: 'desc' }],
              select: {
                paymentAttemptId: true,
                attemptCode: true,
                amount: true,
                confirmationMode: true,
                status: true,
                createdAt: true,
                expiresAt: true,
              },
            },
          },
        },
      },
    })
    if (!row) return null

    const { paymentIntent, ...payment } = row
    return {
      ...this.toRecord(payment),
      paymentIntent: paymentIntent
        ? {
            paymentIntentId: paymentIntent.paymentIntentId,
            status: paymentIntent.status as string as PaymentIntentStatus,
            updatedAt: paymentIntent.updatedAt,
          }
        : null,
      attempts: (paymentIntent?.attempts ?? []).map((attempt) => ({
        ...attempt,
        confirmationMode: attempt.confirmationMode as string as PaymentConfirmationMode,
        status: attempt.status as string as PaymentAttemptStatus,
      })),
    }
  }

  private toRecord(row: Prisma.TuitionPaymentGetPayload<{ select: typeof paymentSelect }>): ParentTuitionPaymentRecord {
    return {
      paymentId: row.paymentId,
      studentId: row.studentId,
      month: row.month,
      year: row.year,
      amount: row.amount,
      status: row.status as string as DomainTuitionPaymentStatus,
      paidAt: row.paidAt,
      payerReportedTransferredAt: row.payerReportedTransferredAt,
    }
  }
}
