import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
  GetTuitionGradeBankAccountsUseCase,
  UpdateTuitionGradeBankAccountsUseCase,
} from './'

const TUITION_GRADE_BANK_ACCOUNT_USE_CASES = [
  GetTuitionGradeBankAccountsUseCase,
  UpdateTuitionGradeBankAccountsUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: TUITION_GRADE_BANK_ACCOUNT_USE_CASES,
  exports: TUITION_GRADE_BANK_ACCOUNT_USE_CASES,
})
export class TuitionGradeBankAccountApplicationModule {}
