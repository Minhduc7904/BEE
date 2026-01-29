import { PrismaService } from '../../../prisma/prisma.service'
import type { ITuitionPaymentRepository } from '../../../domain/repositories'
import type {
  CreateTuitionPaymentData,
  UpdateTuitionPaymentData,
  TuitionPaymentFilterOptions,
  TuitionPaymentPaginationOptions,
  TuitionPaymentListResult,
  TuitionPaymentStatusStats,
  TuitionPaymentMonthlyStats,
  TuitionPaymentCourseStats,
  TuitionPaymentMoneyStats,
} from '../../../domain/interface'
import { TuitionPayment } from '../../../domain/entities'
import { TuitionPaymentStatus } from '../../../shared/enums'
import { NumberUtil } from '../../../shared/utils'

export class PrismaTuitionPaymentRepository implements ITuitionPaymentRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  // ======================
  // CRUD
  // ======================

  async create(data: CreateTuitionPaymentData): Promise<TuitionPayment> {
    return this.prisma.tuitionPayment.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        month: data.month,
        year: data.year,
        amount: data.amount, // 💰 NEW FIELD (BẮT BUỘC)
        status: data.status || TuitionPaymentStatus.UNPAID,
        paidAt: data.paidAt,
        notes: data.notes,
      },
      include: {
        student: true,
        course: true,
      },
    })
  }

  async findById(id: number): Promise<TuitionPayment | null> {
    const paymentId = NumberUtil.ensureValidId(id, 'Payment ID')

    return this.prisma.tuitionPayment.findUnique({
      where: { paymentId },
      include: {
        student: true,
        course: true,
      },
    })
  }

  async update(id: number, data: UpdateTuitionPaymentData): Promise<TuitionPayment> {
    const paymentId = NumberUtil.ensureValidId(id, 'Payment ID')

    return this.prisma.tuitionPayment.update({
      where: { paymentId },
      data: {
        ...data,
      },
      include: {
        student: true,
        course: true,
      },
    })
  }

  async delete(id: number): Promise<boolean> {
    const paymentId = NumberUtil.ensureValidId(id, 'Payment ID')

    await this.prisma.tuitionPayment.delete({
      where: { paymentId },
    })

    return true
  }

  // ======================
  // BASIC QUERY
  // ======================

  async findAll(): Promise<TuitionPayment[]> {
    return this.prisma.tuitionPayment.findMany({
      include: {
        student: true,
        course: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  // ======================
  // PAGINATION + FILTER
  // ======================

  async findAllWithPagination(
    pagination: TuitionPaymentPaginationOptions,
    filters?: TuitionPaymentFilterOptions,
  ): Promise<TuitionPaymentListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'

    const where: any = {}

    if (filters?.studentId) where.studentId = filters.studentId
    if (filters?.courseId) where.courseId = filters.courseId
    if (filters?.status) where.status = filters.status
    if (filters?.year) where.year = filters.year
    if (filters?.month) where.month = filters.month

    if (filters?.fromPaidAt || filters?.toPaidAt) {
      where.paidAt = {}
      if (filters.fromPaidAt) where.paidAt.gte = filters.fromPaidAt
      if (filters.toPaidAt) where.paidAt.lte = filters.toPaidAt
    }

    const [payments, total] = await Promise.all([
      this.prisma.tuitionPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          student: true,
          course: true,
        },
      }),
      this.prisma.tuitionPayment.count({ where }),
    ])

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findWithFilter(filters: TuitionPaymentFilterOptions): Promise<TuitionPayment[]> {
    const { studentId, studentIds, courseId, status, year, month, fromPaidAt, toPaidAt } = filters

    const where: any = {
      ...(courseId && { courseId }),
      ...(status && { status }),
      ...(year && { year }),
      ...(month && { month }),
    }

    /**
     * Student filter
     * - Ưu tiên studentIds (bulk / stats)
     * - Nếu không có thì dùng studentId
     */
    if (studentIds?.length) {
      where.studentId = { in: studentIds }
    } else if (studentId) {
      where.studentId = studentId
    }

    /**
     * PaidAt filter
     * - Chỉ áp dụng cho record đã PAID
     * - Tránh loại UNPAID (paidAt = null)
     */
    if (fromPaidAt || toPaidAt) {
      where.AND = [
        { paidAt: { not: null } },
        {
          paidAt: {
            ...(fromPaidAt && { gte: fromPaidAt }),
            ...(toPaidAt && { lte: toPaidAt }),
          },
        },
      ]
    }

    return this.prisma.tuitionPayment.findMany({
      where,
      include: {
        student: true,
        course: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async exists(filters: TuitionPaymentFilterOptions): Promise<boolean> {
    const results = await this.findWithFilter(filters)
    return results.length > 0
  }

  // ======================
  // FIND SPECIFIC
  // ======================

  async findByStudent(studentId: number): Promise<TuitionPayment[]> {
    return this.prisma.tuitionPayment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByCourse(courseId: number): Promise<TuitionPayment[]> {
    return this.prisma.tuitionPayment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByStudentAndPeriod(studentId: number, month: number, year: number): Promise<TuitionPayment | null> {
    return this.prisma.tuitionPayment.findFirst({
      where: {
        studentId,
        month,
        year,
      },
    })
  }

  async findByStatus(status: TuitionPaymentStatus): Promise<TuitionPayment[]> {
    return this.prisma.tuitionPayment.findMany({
      where: { status },
    })
  }

  // ======================
  // COUNT
  // ======================

  async count(filters?: TuitionPaymentFilterOptions): Promise<number> {
    return this.prisma.tuitionPayment.count({
      where: filters,
    })
  }

  async countByStudent(studentId: number): Promise<number> {
    return this.prisma.tuitionPayment.count({
      where: { studentId },
    })
  }

  async countByCourse(courseId: number): Promise<number> {
    return this.prisma.tuitionPayment.count({
      where: { courseId },
    })
  }

  async countUnpaid(filters?: TuitionPaymentFilterOptions): Promise<number> {
    return this.prisma.tuitionPayment.count({
      where: {
        ...filters,
        status: TuitionPaymentStatus.UNPAID,
      },
    })
  }

  // ======================
  // 📊 STATISTICS
  // ======================

  async statsByStatus(filters?: TuitionPaymentFilterOptions): Promise<TuitionPaymentStatusStats[]> {
    const result = await this.prisma.tuitionPayment.groupBy({
      by: ['status'],
      where: filters,
      _count: { _all: true },
    })

    return result.map((r) => ({
      status: r.status,
      total: r._count._all,
    }))
  }

  async statsByMonth(year: number, courseId?: number): Promise<TuitionPaymentMonthlyStats[]> {
    const where: any = { year }
    if (courseId) where.courseId = courseId

    const result = await this.prisma.tuitionPayment.groupBy({
      by: ['month', 'status'],
      where,
      _count: { _all: true },
    })

    const map = new Map<string, TuitionPaymentMonthlyStats>()

    for (const r of result) {
      const key = `${r.month}-${year}`
      if (!map.has(key)) {
        map.set(key, {
          month: r.month!,
          year,
          total: 0,
          paid: 0,
          unpaid: 0,
        })
      }

      const item = map.get(key)!
      item.total += r._count._all

      if (r.status === TuitionPaymentStatus.PAID) item.paid += r._count._all
      if (r.status === TuitionPaymentStatus.UNPAID) item.unpaid += r._count._all
    }

    return Array.from(map.values()).sort((a, b) => a.month - b.month)
  }

  async statsByCourse(year?: number, month?: number): Promise<TuitionPaymentCourseStats[]> {
    const where: any = {}
    if (year) where.year = year
    if (month) where.month = month

    const result = await this.prisma.tuitionPayment.groupBy({
      by: ['courseId', 'status'],
      where,
      _count: { _all: true },
    })

    const map = new Map<number, TuitionPaymentCourseStats>()

    for (const r of result) {
      if (!r.courseId) continue

      if (!map.has(r.courseId)) {
        map.set(r.courseId, {
          courseId: r.courseId,
          total: 0,
          paid: 0,
          unpaid: 0,
        })
      }

      const item = map.get(r.courseId)!
      item.total += r._count._all

      if (r.status === TuitionPaymentStatus.PAID) item.paid += r._count._all
      if (r.status === TuitionPaymentStatus.UNPAID) item.unpaid += r._count._all
    }

    return Array.from(map.values())
  }

  // ======================
  // 💰 MONEY STATISTICS
  // ======================

  async statsMoney(filters?: TuitionPaymentFilterOptions): Promise<TuitionPaymentMoneyStats> {
    const whereBase: any = {}

    if (filters?.studentId) whereBase.studentId = filters.studentId
    if (filters?.courseId) whereBase.courseId = filters.courseId
    if (filters?.year) whereBase.year = filters.year
    if (filters?.month) whereBase.month = filters.month

    if (filters?.studentIds?.length) {
      whereBase.studentId = { in: filters.studentIds }
    }

    const [paid, unpaid, total] = await Promise.all([
      // 💰 ĐÃ THU
      this.prisma.tuitionPayment.aggregate({
        where: {
          ...whereBase,
          status: TuitionPaymentStatus.PAID,
        },
        _sum: {
          amount: true,
        },
      }),

      // 💸 CHƯA THU
      this.prisma.tuitionPayment.aggregate({
        where: {
          ...whereBase,
          status: TuitionPaymentStatus.UNPAID,
        },
        _sum: {
          amount: true,
        },
      }),

      // 📊 DỰ KIẾN (TẤT CẢ)
      this.prisma.tuitionPayment.aggregate({
        where: {
          ...whereBase,
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    return {
      collected: paid._sum.amount ?? 0,
      uncollected: unpaid._sum.amount ?? 0,
      expected: total._sum.amount ?? 0,
    }
  }
}
