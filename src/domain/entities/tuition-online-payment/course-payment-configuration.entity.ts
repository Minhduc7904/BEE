export class CoursePaymentConfiguration {
  coursePaymentConfigurationId: number
  scopeKey: string
  receivingBankAccountId: number
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    coursePaymentConfigurationId: number
    scopeKey: string
    receivingBankAccountId: number
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.coursePaymentConfigurationId = data.coursePaymentConfigurationId
    this.scopeKey = data.scopeKey
    this.receivingBankAccountId = data.receivingBankAccountId
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }
}
