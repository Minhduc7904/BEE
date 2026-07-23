import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as useCases from './assistant-shift.use-cases'

const ASSISTANT_SHIFT_USE_CASES = Object.values(useCases)
@Module({ imports: [InfrastructureModule], providers: ASSISTANT_SHIFT_USE_CASES, exports: ASSISTANT_SHIFT_USE_CASES })
export class AssistantShiftApplicationModule {}
