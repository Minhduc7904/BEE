export class OnlineCourseInvoiceItem {
  invoiceItemId: number
  invoiceId: number
  courseTitle: string
  unitPriceAmount: number
  quantity: number
  discountAmount: number
  totalAmount: number
  createdAt: Date
  updatedAt: Date

  courseId?: number | null
  enrollmentId?: number | null
  courseCode?: string | null
  metadata?: any

  constructor(data: {
    invoiceItemId: number
    invoiceId: number
    courseTitle: string
    unitPriceAmount?: number
    quantity?: number
    discountAmount?: number
    totalAmount?: number
    courseId?: number | null
    enrollmentId?: number | null
    courseCode?: string | null
    metadata?: any
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.invoiceItemId = data.invoiceItemId
    this.invoiceId = data.invoiceId
    this.courseTitle = data.courseTitle
    this.unitPriceAmount = data.unitPriceAmount ?? 0
    this.quantity = data.quantity ?? 1
    this.discountAmount = data.discountAmount ?? 0
    this.totalAmount = data.totalAmount ?? 0
    this.courseId = data.courseId ?? null
    this.enrollmentId = data.enrollmentId ?? null
    this.courseCode = data.courseCode ?? null
    this.metadata = data.metadata
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  hasEnrollment(): boolean {
    return this.enrollmentId !== null && this.enrollmentId !== undefined
  }

  toJSON() {
    return { ...this }
  }
}
