import type {
  CreateOnlineCourseInvoiceData,
  IOnlineCourseInvoiceRepository,
  OnlineCourseInvoiceListOptions,
  OnlineCourseInvoiceListResult,
  UpdateOnlineCourseInvoiceData,
} from '../../../domain/repositories/online-course-invoice.repository'
import { OnlineCourseInvoice } from '../../../domain/entities/online-course-payment'
import { OnlineCourseInvoiceStatus } from '../../../shared/enums'
import { OnlineCoursePaymentMapper } from '../../mappers/payment'
import { PrismaService } from '../../../prisma/prisma.service'

export class PrismaOnlineCourseInvoiceRepository implements IOnlineCourseInvoiceRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateOnlineCourseInvoiceData): Promise<OnlineCourseInvoice> {
    const created = await this.prisma.onlineCourseInvoice.create({
      data,
      include: this.defaultInclude(),
    })

    return OnlineCoursePaymentMapper.toDomainInvoice(created)!
  }

  async findById(invoiceId: number): Promise<OnlineCourseInvoice | null> {
    const invoice = await this.prisma.onlineCourseInvoice.findUnique({
      where: { invoiceId },
      include: this.defaultInclude(),
    })

    return OnlineCoursePaymentMapper.toDomainInvoice(invoice)
  }

  async findByCode(invoiceCode: string): Promise<OnlineCourseInvoice | null> {
    const invoice = await this.prisma.onlineCourseInvoice.findUnique({
      where: { invoiceCode },
      include: this.defaultInclude(),
    })

    return OnlineCoursePaymentMapper.toDomainInvoice(invoice)
  }

  async findPendingByStudentAndCourse(studentId: number, courseId: number): Promise<OnlineCourseInvoice | null> {
    const invoice = await this.prisma.onlineCourseInvoice.findFirst({
      where: {
        studentId,
        status: OnlineCourseInvoiceStatus.PENDING_PAYMENT,
        items: {
          some: { courseId },
        },
      },
      include: this.defaultInclude(),
      orderBy: { createdAt: 'desc' },
    })

    return OnlineCoursePaymentMapper.toDomainInvoice(invoice)
  }

  async findLatestByStudentAndCourse(studentId: number, courseId: number): Promise<OnlineCourseInvoice | null> {
    const invoice = await this.prisma.onlineCourseInvoice.findFirst({
      where: {
        studentId,
        items: {
          some: { courseId },
        },
      },
      include: this.defaultInclude(),
      orderBy: { createdAt: 'desc' },
    })

    return OnlineCoursePaymentMapper.toDomainInvoice(invoice)
  }

  async findAllWithPagination(options: OnlineCourseInvoiceListOptions): Promise<OnlineCourseInvoiceListResult> {
    const where = this.buildWhere(options)
    const orderBy = this.buildOrderBy(options.sortBy, options.sortOrder)

    const [data, total] = await Promise.all([
      this.prisma.onlineCourseInvoice.findMany({
        where,
        include: this.defaultInclude(),
        orderBy,
        skip: options.skip,
        take: options.take,
      }),
      this.prisma.onlineCourseInvoice.count({ where }),
    ])

    return {
      data: OnlineCoursePaymentMapper.toDomainInvoices(data),
      total,
    }
  }

  async update(invoiceId: number, data: UpdateOnlineCourseInvoiceData): Promise<OnlineCourseInvoice> {
    const updated = await this.prisma.onlineCourseInvoice.update({
      where: { invoiceId },
      data,
      include: this.defaultInclude(),
    })

    return OnlineCoursePaymentMapper.toDomainInvoice(updated)!
  }

  async markPaid(invoiceId: number, paidAmount: number, paidAt: Date = new Date()): Promise<OnlineCourseInvoice> {
    return this.update(invoiceId, {
      status: OnlineCourseInvoiceStatus.PAID,
      paidAmount,
      paidAt,
    })
  }

  async markPaymentFailed(invoiceId: number, reason?: string): Promise<OnlineCourseInvoice> {
    return this.update(invoiceId, {
      status: OnlineCourseInvoiceStatus.PAYMENT_FAILED,
      notes: reason,
    })
  }

  private defaultInclude() {
    return {
      items: true,
      paymentAttempts: true,
    }
  }

  private buildWhere(options: OnlineCourseInvoiceListOptions): any {
    const where: any = {}

    if (options.status) where.status = options.status
    if (options.paymentProvider) where.paymentProvider = options.paymentProvider
    if (options.studentId) where.studentId = options.studentId
    if (options.buyerUserId) where.buyerUserId = options.buyerUserId

    if (options.invoiceCode) {
      where.invoiceCode = {
        contains: options.invoiceCode,
      }
    }

    if (options.fromDate || options.toDate) {
      where.createdAt = {}
      if (options.fromDate) where.createdAt.gte = options.fromDate
      if (options.toDate) where.createdAt.lte = options.toDate
    }

    if (options.search) {
      where.OR = [
        { invoiceCode: { contains: options.search } },
        { providerOrderId: { contains: options.search } },
        { notes: { contains: options.search } },
        {
          items: {
            some: {
              OR: [
                { courseTitle: { contains: options.search } },
                { courseCode: { contains: options.search } },
              ],
            },
          },
        },
      ]
    }

    return where
  }

  private buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any {
    const allowedFields = new Set([
      'invoiceId',
      'invoiceCode',
      'status',
      'subtotalAmount',
      'discountAmount',
      'totalAmount',
      'paidAmount',
      'paymentProvider',
      'createdAt',
      'updatedAt',
      'paidAt',
      'expiresAt',
    ])
    const field = sortBy && allowedFields.has(sortBy) ? sortBy : 'createdAt'

    return { [field]: sortOrder }
  }
}
