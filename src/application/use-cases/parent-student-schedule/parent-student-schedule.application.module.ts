import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { GetParentStudentScheduleWeekUseCase } from '.'

const useCases = [GetParentStudentScheduleWeekUseCase]

@Module({
  imports: [InfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentScheduleApplicationModule {}
