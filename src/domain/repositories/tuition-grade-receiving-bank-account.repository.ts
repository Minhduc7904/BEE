import { TuitionGradeReceivingBankAccount } from '../entities/tuition-online-payment'
import {
  CreateTuitionGradeReceivingBankAccountData,
  TuitionGradeReceivingBankAccountListOptions,
  UpdateTuitionGradeReceivingBankAccountData,
} from '../interface/tuition-online-payment'

export interface ITuitionGradeReceivingBankAccountRepository {
  create(data: CreateTuitionGradeReceivingBankAccountData): Promise<TuitionGradeReceivingBankAccount>
  findById(tuitionGradeReceivingBankAccountId: number): Promise<TuitionGradeReceivingBankAccount | null>
  findByGrade(grade: number): Promise<TuitionGradeReceivingBankAccount | null>
  findAll(options?: TuitionGradeReceivingBankAccountListOptions): Promise<TuitionGradeReceivingBankAccount[]>
  update(
    tuitionGradeReceivingBankAccountId: number,
    data: UpdateTuitionGradeReceivingBankAccountData,
  ): Promise<TuitionGradeReceivingBankAccount>
  delete(tuitionGradeReceivingBankAccountId: number): Promise<void>
}
