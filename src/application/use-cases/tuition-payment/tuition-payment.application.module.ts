import { Module } from '@nestjs/common'

import * as tuitionPaymentUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { NotificationApplicationModule } from '../notification/notification.application.module'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

const TUITION_PAYMENT_USE_CASES = [
  tuitionPaymentUseCase.CreateTuitionPaymentUseCase,
  tuitionPaymentUseCase.CreateBulkTuitionPaymentUseCase,
  tuitionPaymentUseCase.GetTuitionPaymentsUseCase,
  tuitionPaymentUseCase.GetTuitionPaymentByIdUseCase,
  tuitionPaymentUseCase.UpdateTuitionPaymentUseCase,
  tuitionPaymentUseCase.DeleteTuitionPaymentUseCase,
  // stats
  tuitionPaymentUseCase.GetTuitionPaymentStatsByStatusUseCase,
  tuitionPaymentUseCase.GetMyTuitionPaymentStatsByStatusUseCase,
  tuitionPaymentUseCase.GetTuitionPaymentStatsByMoneyUseCase,
  tuitionPaymentUseCase.GetMyTuitionPaymentStatsByMoneyUseCase,
  tuitionPaymentUseCase.ExportExcelTuitionPaymentExampleUseCase,
  tuitionPaymentUseCase.PreviewImportTuitionPaymentUseCase,
  // bulk array
  tuitionPaymentUseCase.CreateArrayBulkTuitionPaymentUseCase,
  tuitionPaymentUseCase.UpdateArrayBulkTuitionPaymentUseCase,
  // monthly stats
  tuitionPaymentUseCase.GetMonthlyTuitionPaymentStatsUseCase,
  // export
  tuitionPaymentUseCase.ExportTuitionPaymentListUseCase,
  tuitionPaymentUseCase.SendTuitionPaymentToParentUseCase,
  tuitionPaymentUseCase.SendBulkTuitionPaymentToParentUseCase,
  GetValidZaloAccessTokenUseCase,
]
@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
    NotificationApplicationModule, // 🔔 For tuition payment notifications
  ],
  providers: TUITION_PAYMENT_USE_CASES,
  exports: TUITION_PAYMENT_USE_CASES,
})
export class TuitionPaymentApplicationModule {}
