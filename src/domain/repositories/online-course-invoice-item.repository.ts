import { OnlineCourseInvoiceItem } from '../entities/online-course-payment'

export interface CreateOnlineCourseInvoiceItemData {
  invoiceId: number
  courseId?: number | null
  enrollmentId?: number | null
  courseCode?: string | null
  courseTitle: string
  unitPriceAmount?: number
  quantity?: number
  discountAmount?: number
  totalAmount?: number
  metadata?: any
}

export interface UpdateOnlineCourseInvoiceItemData {
  enrollmentId?: number | null
  courseCode?: string | null
  courseTitle?: string
  unitPriceAmount?: number
  quantity?: number
  discountAmount?: number
  totalAmount?: number
  metadata?: any
}

export interface IOnlineCourseInvoiceItemRepository {
  create(data: CreateOnlineCourseInvoiceItemData): Promise<OnlineCourseInvoiceItem>
  createMany(data: CreateOnlineCourseInvoiceItemData[]): Promise<OnlineCourseInvoiceItem[]>
  findById(invoiceItemId: number): Promise<OnlineCourseInvoiceItem | null>
  findByInvoice(invoiceId: number): Promise<OnlineCourseInvoiceItem[]>
  update(invoiceItemId: number, data: UpdateOnlineCourseInvoiceItemData): Promise<OnlineCourseInvoiceItem>
  attachEnrollment(invoiceItemId: number, enrollmentId: number): Promise<OnlineCourseInvoiceItem>
}
