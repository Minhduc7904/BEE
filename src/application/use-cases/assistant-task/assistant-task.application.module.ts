import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as providers from './index'

const ASSISTANT_TASK_PROVIDERS = Object.values(providers)

@Module({
  imports: [InfrastructureModule],
  providers: ASSISTANT_TASK_PROVIDERS,
  exports: ASSISTANT_TASK_PROVIDERS,
})
export class AssistantTaskApplicationModule {}
