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
  MonthlyPaymentStats,
} from '../../../domain/interface'
import { TuitionPayment } from '../../../domain/entities'
import { TuitionPaymentStatus } from '../../../shared/enums'
import { NumberUtil } from '../../../shared/utils'
import { TuitionPaymentMapper } from 'src/infrastructure/mappers/tuition-payment/tuition-payment.mapper'

export class PrismaTuitionPaymentRepository implements ITuitionPaymentRepository {
  constructor(private readonly prisma: PrismaService | any) { }

  // ======================
  // CRUD
  // ======================

  async create(data: CreateTuitionPaymentData): Promise<TuitionPayment> {
    const payment = await this.prisma.tuitionPayment.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        month: data.month,
        year: data.year,
        amount: data.amount,
        status: data.status || TuitionPaymentStatus.UNPAID,
        paidAt: data.paidAt,
        notes: data.notes,
      },
      include: {
        student: { include: { user: true } },
        course: true,
      },
    })

    return TuitionPaymentMapper.toDomainTuitionPayment(payment)!
  }


  async findById(id: number): Promise<TuitionPayment | null> {
    const payment = await this.prisma.tuitionPayment.findUnique({
      where: { paymentId: NumberUtil.ensureValidId(id, 'Payment ID') },
      include: {
        student: { include: { user: true } },
        course: true,
      },
    })

    return TuitionPaymentMapper.toDomainTuitionPayment(payment) || null
  }

  async update(id: number, data: UpdateTuitionPaymentData): Promise<TuitionPayment | null> {
    const payment = await this.prisma.tuitionPayment.update({
      where: { paymentId: NumberUtil.ensureValidId(id, 'Payment ID') },
      data,
      include: {
        student: { include: { user: true } },
        course: true,
      },
    })

    return TuitionPaymentMapper.toDomainTuitionPayment(payment) || null
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
    const payments = await this.prisma.tuitionPayment.findMany({
      include: {
        student: { include: { user: true } },
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return TuitionPaymentMapper.toDomainTuitionPayments(payments)
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
          student: {
            include: {
              user: true,
            },
          },
          course: true,
        },
      }),
      this.prisma.tuitionPayment.count({ where }),
    ])

    return {
      data: TuitionPaymentMapper.toDomainTuitionPayments(payments),
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

    const payments = await this.prisma.tuitionPayment.findMany({
      where,
      include: {
        student: { include: { user: true } },
        course: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return TuitionPaymentMapper.toDomainTuitionPayments(payments)
  }

  async exists(filters: TuitionPaymentFilterOptions): Promise<boolean> {
    const results = await this.findWithFilter(filters)
    return results.length > 0
  }

  // ======================
  // FIND SPECIFIC
  // ======================

  async findByStudent(studentId: number): Promise<TuitionPayment[]> {
    const payments = await this.prisma.tuitionPayment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })

    return TuitionPaymentMapper.toDomainTuitionPayments(payments)
  }

  async findByCourse(courseId: number): Promise<TuitionPayment[]> {
    const payments = await this.prisma.tuitionPayment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    })

    return TuitionPaymentMapper.toDomainTuitionPayments(payments)
  }

  async findByStudentAndPeriod(studentId: number, month: number, year: number): Promise<TuitionPayment | null> {
    const payment = await this.prisma.tuitionPayment.findFirst({
      where: {
        studentId,
        month,
        year,
      },
    })
    return TuitionPaymentMapper.toDomainTuitionPayment(payment) || null
  }

  async findByMonthYear(month: number, year: number, studentIds: number[]): Promise<TuitionPayment[]> {
    const payments = await this.prisma.tuitionPayment.findMany({
      where: {
        month,
        year,
        studentId: { in: studentIds },
      },
      include: {
        student: { include: { user: true } },
        course: true,
      },
    })
    
    return TuitionPaymentMapper.toDomainTuitionPayments(payments)
  }

  async findByStatus(status: TuitionPaymentStatus): Promise<TuitionPayment[]> {
    const payments = await this.prisma.tuitionPayment.findMany({
      where: { status },
    })

    return TuitionPaymentMapper.toDomainTuitionPayments(payments)
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

  async statsByMonthlyAmount(year: number, courseId?: number, studentId?: number): Promise<MonthlyPaymentStats[]> {
    const where: any = {
      year,
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (studentId) {
      where.studentId = studentId
    }

    // Get all payments for the year
    const payments = await this.prisma.tuitionPayment.findMany({
      where,
      select: {
        month: true,
        amount: true,
        status: true,
      },
    })

    // Initialize monthly stats (1-12)
    const monthlyStatsMap: Map<number, MonthlyPaymentStats> = new Map()
    for (let month = 1; month <= 12; month++) {
      monthlyStatsMap.set(month, {
        month,
        paidAmount: 0,
        unpaidAmount: 0,
        totalAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
        totalCount: 0,
      })
    }

    // Aggregate data by month
    payments.forEach((payment) => {
      const stats = monthlyStatsMap.get(payment.month)!
      
      stats.totalAmount += payment.amount ?? 0
      stats.totalCount += 1

      if (payment.status === TuitionPaymentStatus.PAID) {
        stats.paidAmount += payment.amount ?? 0
        stats.paidCount += 1
      } else {
        stats.unpaidAmount += payment.amount ?? 0
        stats.unpaidCount += 1
      }
    })

    // Convert to array
    return Array.from(monthlyStatsMap.values())
  }
}
