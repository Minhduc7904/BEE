import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as receivingBankAccountUseCases from './'

const RECEIVING_BANK_ACCOUNT_USE_CASES = [
  receivingBankAccountUseCases.GetReceivingBankAccountsUseCase,
  receivingBankAccountUseCases.GetReceivingBankAccountBalanceUseCase,
  receivingBankAccountUseCases.SyncReceivingBankAccountsFromSepayUseCase,
  receivingBankAccountUseCases.CreateReceivingBankAccountUseCase,
  receivingBankAccountUseCases.UpdateReceivingBankAccountUseCase,
  receivingBankAccountUseCases.ActivateReceivingBankAccountUseCase,
  receivingBankAccountUseCases.DeactivateReceivingBankAccountUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: RECEIVING_BANK_ACCOUNT_USE_CASES,
  exports: RECEIVING_BANK_ACCOUNT_USE_CASES,
})
export class ReceivingBankAccountApplicationModule {}
