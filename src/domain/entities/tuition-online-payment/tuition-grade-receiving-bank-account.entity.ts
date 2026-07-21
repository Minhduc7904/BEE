export class TuitionGradeReceivingBankAccount {
  tuitionGradeReceivingBankAccountId: number
  grade: number
  receivingBankAccountId?: number | null
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    tuitionGradeReceivingBankAccountId: number
    grade: number
    receivingBankAccountId?: number | null
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.tuitionGradeReceivingBankAccountId = data.tuitionGradeReceivingBankAccountId
    this.grade = data.grade
    this.receivingBankAccountId = data.receivingBankAccountId ?? null
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }
}
