import { Module } from '@nestjs/common'

import * as mediaUsageUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const MEDIA_USAGE_USE_CASES = [
  mediaUsageUseCase.AttachMediaUseCase,
  mediaUsageUseCase.DetachMediaUseCase,
  mediaUsageUseCase.DetachMediaByEntityUseCase,
  mediaUsageUseCase.GetMediaUsagesByMediaUseCase,
  mediaUsageUseCase.GetMediaUsagesByEntityUseCase,
  mediaUsageUseCase.GetMediaUsagesUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: MEDIA_USAGE_USE_CASES,
  exports: MEDIA_USAGE_USE_CASES,
})
export class MediaUsageApplicationModule {}
