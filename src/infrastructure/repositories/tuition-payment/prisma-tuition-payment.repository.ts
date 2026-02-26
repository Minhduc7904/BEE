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
import { NumberUtil, TextSearchUtil } from '../../../shared/utils'
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

    if (filters?.search || filters?.grade !== undefined || filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      return this.findWithRawQuery(pagination, filters)
    }

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

  private buildRemoveAccentsSQL(columnName: string): string {
    const replacements = [
      ['à', 'a'], ['á', 'a'], ['ạ', 'a'], ['ả', 'a'], ['ã', 'a'],
      ['â', 'a'], ['ầ', 'a'], ['ấ', 'a'], ['ậ', 'a'], ['ẩ', 'a'], ['ẫ', 'a'],
      ['ă', 'a'], ['ằ', 'a'], ['ắ', 'a'], ['ặ', 'a'], ['ẳ', 'a'], ['ẵ', 'a'],
      ['è', 'e'], ['é', 'e'], ['ẹ', 'e'], ['ẻ', 'e'], ['ẽ', 'e'],
      ['ê', 'e'], ['ề', 'e'], ['ế', 'e'], ['ệ', 'e'], ['ể', 'e'], ['ễ', 'e'],
      ['ì', 'i'], ['í', 'i'], ['ị', 'i'], ['ỉ', 'i'], ['ĩ', 'i'],
      ['ò', 'o'], ['ó', 'o'], ['ọ', 'o'], ['ỏ', 'o'], ['õ', 'o'],
      ['ô', 'o'], ['ồ', 'o'], ['ố', 'o'], ['ộ', 'o'], ['ổ', 'o'], ['ỗ', 'o'],
      ['ơ', 'o'], ['ờ', 'o'], ['ớ', 'o'], ['ợ', 'o'], ['ở', 'o'], ['ỡ', 'o'],
      ['ù', 'u'], ['ú', 'u'], ['ụ', 'u'], ['ủ', 'u'], ['ũ', 'u'],
      ['ư', 'u'], ['ừ', 'u'], ['ứ', 'u'], ['ự', 'u'], ['ử', 'u'], ['ữ', 'u'],
      ['ỳ', 'y'], ['ý', 'y'], ['ỵ', 'y'], ['ỷ', 'y'], ['ỹ', 'y'],
      ['đ', 'd'],
      ['À', 'A'], ['Á', 'A'], ['Ạ', 'A'], ['Ả', 'A'], ['Ã', 'A'],
      ['Â', 'A'], ['Ầ', 'A'], ['Ấ', 'A'], ['Ậ', 'A'], ['Ẩ', 'A'], ['Ẫ', 'A'],
      ['Ă', 'A'], ['Ằ', 'A'], ['Ắ', 'A'], ['Ặ', 'A'], ['Ẳ', 'A'], ['Ẵ', 'A'],
      ['È', 'E'], ['É', 'E'], ['Ẹ', 'E'], ['Ẻ', 'E'], ['Ẽ', 'E'],
      ['Ê', 'E'], ['Ề', 'E'], ['Ế', 'E'], ['Ệ', 'E'], ['Ể', 'E'], ['Ễ', 'E'],
      ['Ì', 'I'], ['Í', 'I'], ['Ị', 'I'], ['Ỉ', 'I'], ['Ĩ', 'I'],
      ['Ò', 'O'], ['Ó', 'O'], ['Ọ', 'O'], ['Ỏ', 'O'], ['Õ', 'O'],
      ['Ô', 'O'], ['Ồ', 'O'], ['Ố', 'O'], ['Ộ', 'O'], ['Ổ', 'O'], ['Ỗ', 'O'],
      ['Ơ', 'O'], ['Ờ', 'O'], ['Ớ', 'O'], ['Ợ', 'O'], ['Ở', 'O'], ['Ỡ', 'O'],
      ['Ù', 'U'], ['Ú', 'U'], ['Ụ', 'U'], ['Ủ', 'U'], ['Ũ', 'U'],
      ['Ư', 'U'], ['Ừ', 'U'], ['Ứ', 'U'], ['Ự', 'U'], ['Ử', 'U'], ['Ữ', 'U'],
      ['Ỳ', 'Y'], ['Ý', 'Y'], ['Ỵ', 'Y'], ['Ỷ', 'Y'], ['Ỹ', 'Y'],
      ['Đ', 'D'],
    ]
    let sql = columnName
    for (const [accented, plain] of replacements) {
      sql = `REPLACE(${sql}, '${accented}', '${plain}')`
    }
    return sql
  }

  private async findWithRawQuery(
    pagination: TuitionPaymentPaginationOptions,
    filters: TuitionPaymentFilterOptions,
  ): Promise<TuitionPaymentListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'createdAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []

    if (filters.studentId) {
      conditions.push('tp.student_id = ?')
      params.push(filters.studentId)
    }

    if (filters.studentIds?.length) {
      const placeholders = filters.studentIds.map(() => '?').join(', ')
      conditions.push(`tp.student_id IN (${placeholders})`)
      params.push(...filters.studentIds)
    }

    if (filters.courseId) {
      conditions.push('tp.course_id = ?')
      params.push(filters.courseId)
    }

    if (filters.status) {
      conditions.push('tp.status = ?')
      params.push(filters.status)
    }

    if (filters.year) {
      conditions.push('tp.year = ?')
      params.push(filters.year)
    }

    if (filters.month) {
      conditions.push('tp.month = ?')
      params.push(filters.month)
    }

    if (filters.fromPaidAt) {
      conditions.push('tp.paid_at >= ?')
      params.push(filters.fromPaidAt)
    }

    if (filters.toPaidAt) {
      conditions.push('tp.paid_at <= ?')
      params.push(filters.toPaidAt)
    }

    if (filters.grade !== undefined) {
      conditions.push('s.grade = ?')
      params.push(filters.grade)
    }

    if (filters.minAmount !== undefined) {
      conditions.push('tp.amount >= ?')
      params.push(filters.minAmount)
    }

    if (filters.maxAmount !== undefined) {
      conditions.push('tp.amount <= ?')
      params.push(filters.maxAmount)
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`
      const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(filters.search)}%`

      const firstNameNoAccent = this.buildRemoveAccentsSQL('u.first_name')
      const lastNameNoAccent = this.buildRemoveAccentsSQL('u.last_name')
      const fullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.last_name, ' ', u.first_name)`)
      const reverseFullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.first_name, ' ', u.last_name)`)

      conditions.push(`(
        LOWER(u.first_name) LIKE LOWER(?) OR
        LOWER(u.last_name) LIKE LOWER(?) OR
        LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER(?) OR
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER(?) OR
        LOWER(${firstNameNoAccent}) LIKE LOWER(?) OR
        LOWER(${lastNameNoAccent}) LIKE LOWER(?) OR
        LOWER(${fullNameNoAccent}) LIKE LOWER(?) OR
        LOWER(${reverseFullNameNoAccent}) LIKE LOWER(?)
      )`)
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
      params.push(normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const columnMap: Record<string, string> = {
      createdAt: 'tp.created_at',
      updatedAt: 'tp.updated_at',
      paidAt: 'tp.paid_at',
      amount: 'tp.amount',
      year: 'tp.year',
      month: 'tp.month',
      status: 'tp.status',
    }
    const orderColumn = columnMap[sortBy] || 'tp.created_at'
    const orderByClause = `ORDER BY ${orderColumn} ${sortOrder}`

    const baseFrom = `
      FROM tuition_payments tp
      INNER JOIN students s ON tp.student_id = s.student_id
      INNER JOIN users u ON s.user_id = u.user_id
      ${whereClause}
    `

    const countQuery = `SELECT COUNT(*) as total ${baseFrom}`
    const idsQuery = `SELECT tp.payment_id ${baseFrom} ${orderByClause} LIMIT ? OFFSET ?`

    const [countResult, idsResult] = await Promise.all([
      this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<[{ total: bigint }]>,
      this.prisma.$queryRawUnsafe(idsQuery, ...params, limit, skip) as Promise<{ payment_id: number }[]>,
    ])

    const total = Number(countResult[0].total)
    const ids = idsResult.map((r: any) => r.payment_id)

    const payments = ids.length === 0
      ? []
      : await this.prisma.tuitionPayment.findMany({
          where: { paymentId: { in: ids } },
          include: {
            student: { include: { user: true } },
            course: true,
          },
        })

    const idOrder = new Map(ids.map((id: number, i: number) => [id, i]))
    payments.sort((a: any, b: any) => (idOrder.get(a.paymentId) ?? 0) - (idOrder.get(b.paymentId) ?? 0))

    return {
      data: TuitionPaymentMapper.toDomainTuitionPayments(payments),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
