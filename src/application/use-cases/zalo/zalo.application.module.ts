import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { GetZaloWebhookTokenUseCase, HandleZaloWebhookMessageUseCase } from './'

const ZALO_USE_CASES = [GetZaloWebhookTokenUseCase, HandleZaloWebhookMessageUseCase]

@Module({
  imports: [InfrastructureModule],
  providers: ZALO_USE_CASES,
  exports: ZALO_USE_CASES,
})
export class ZaloApplicationModule {}
