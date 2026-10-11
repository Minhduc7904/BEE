import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as useCases from './index'
import { SessionMakeupRegistrationSyncService } from '../../services/session-makeup-registration-sync.service'

const ASSISTANT_SHIFT_USE_CASES = [...Object.values(useCases), SessionMakeupRegistrationSyncService]

@Module({
  imports: [InfrastructureModule],
  providers: ASSISTANT_SHIFT_USE_CASES,
  exports: ASSISTANT_SHIFT_USE_CASES,
})
export class AssistantShiftApplicationModule {}
