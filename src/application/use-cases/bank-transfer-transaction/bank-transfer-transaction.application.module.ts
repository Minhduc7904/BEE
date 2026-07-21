import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { SepayApplicationModule } from '../sepay/sepay.application.module'
import * as bankTransferTransactionUseCases from './'

const BANK_TRANSFER_TRANSACTION_USE_CASES = [
  bankTransferTransactionUseCases.GetBankTransferTransactionsUseCase,
  bankTransferTransactionUseCases.GetBankTransferTransactionsForTuitionPaymentUseCase,
  bankTransferTransactionUseCases.GetBankTransferTransactionByIdUseCase,
  bankTransferTransactionUseCases.GetBankTransferTransactionStatisticsUseCase,
  bankTransferTransactionUseCases.SyncSepayTransactionsUseCase,
]

@Module({
  imports: [InfrastructureModule, SepayApplicationModule],
  providers: BANK_TRANSFER_TRANSACTION_USE_CASES,
  exports: BANK_TRANSFER_TRANSACTION_USE_CASES,
})
export class BankTransferTransactionApplicationModule {}
