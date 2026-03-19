import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AttendanceApplicationModule } from '../attendance/attendance.application.module'
import {
  GetValidZaloAccessTokenUseCase,
  GetZaloWebhookTokenUseCase,
  HandleZaloUserSelectionUseCase,
  HandleZaloWebhookMessageUseCase,
} from './'

const ZALO_USE_CASES = [
  GetZaloWebhookTokenUseCase,
  GetValidZaloAccessTokenUseCase,
  HandleZaloUserSelectionUseCase,
  HandleZaloWebhookMessageUseCase,
]

@Module({
  imports: [InfrastructureModule, AttendanceApplicationModule],
  providers: ZALO_USE_CASES,
  exports: ZALO_USE_CASES,
})
export class ZaloApplicationModule {}
