import type {
  CreateOnlineCourseInvoiceItemData,
  IOnlineCourseInvoiceItemRepository,
  UpdateOnlineCourseInvoiceItemData,
} from '../../../domain/repositories/online-course-invoice-item.repository'
import { OnlineCourseInvoiceItem } from '../../../domain/entities/online-course-payment'
import { OnlineCoursePaymentMapper } from '../../mappers/payment'
import { PrismaService } from '../../../prisma/prisma.service'

export class PrismaOnlineCourseInvoiceItemRepository implements IOnlineCourseInvoiceItemRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateOnlineCourseInvoiceItemData): Promise<OnlineCourseInvoiceItem> {
    const created = await this.prisma.onlineCourseInvoiceItem.create({ data })
    return OnlineCoursePaymentMapper.toDomainInvoiceItem(created)!
  }

  async createMany(data: CreateOnlineCourseInvoiceItemData[]): Promise<OnlineCourseInvoiceItem[]> {
    const created = await Promise.all(data.map((item) => this.create(item)))
    return created
  }

  async findById(invoiceItemId: number): Promise<OnlineCourseInvoiceItem | null> {
    const item = await this.prisma.onlineCourseInvoiceItem.findUnique({
      where: { invoiceItemId },
    })

    return OnlineCoursePaymentMapper.toDomainInvoiceItem(item)
  }

  async findByInvoice(invoiceId: number): Promise<OnlineCourseInvoiceItem[]> {
    const items = await this.prisma.onlineCourseInvoiceItem.findMany({
      where: { invoiceId },
      orderBy: { invoiceItemId: 'asc' },
    })

    return OnlineCoursePaymentMapper.toDomainInvoiceItems(items)
  }

  async update(invoiceItemId: number, data: UpdateOnlineCourseInvoiceItemData): Promise<OnlineCourseInvoiceItem> {
    const updated = await this.prisma.onlineCourseInvoiceItem.update({
      where: { invoiceItemId },
      data,
    })

    return OnlineCoursePaymentMapper.toDomainInvoiceItem(updated)!
  }

  async attachEnrollment(invoiceItemId: number, enrollmentId: number): Promise<OnlineCourseInvoiceItem> {
    return this.update(invoiceItemId, { enrollmentId })
  }
}
