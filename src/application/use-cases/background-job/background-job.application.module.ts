import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as backgroundJobUseCases from './'

const BACKGROUND_JOB_USE_CASES = [
  backgroundJobUseCases.GetBackgroundJobsUseCase,
  backgroundJobUseCases.GetBackgroundJobByIdUseCase,
  backgroundJobUseCases.UpdateBackgroundJobUseCase,
  backgroundJobUseCases.GetBackgroundJobLocksUseCase,
  backgroundJobUseCases.GetBackgroundJobRunsUseCase,
  backgroundJobUseCases.GetBackgroundJobRunByIdUseCase,
  backgroundJobUseCases.GetSepayTransactionSyncCursorsUseCase,
  backgroundJobUseCases.UpdateSepayTransactionSyncCursorUseCase,
  backgroundJobUseCases.RetentionCleanupService,
]

@Module({
  imports: [InfrastructureModule],
  providers: BACKGROUND_JOB_USE_CASES,
  exports: BACKGROUND_JOB_USE_CASES,
})
export class BackgroundJobApplicationModule {}
