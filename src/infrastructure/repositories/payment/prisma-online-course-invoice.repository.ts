import type {
  CreateOnlineCourseInvoiceData,
  IOnlineCourseInvoiceRepository,
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
}
