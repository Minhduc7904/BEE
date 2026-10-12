import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
  GetParentStudentNextScheduleOverviewUseCase,
  GetParentStudentScheduleSessionDetailUseCase,
  GetParentStudentScheduleWeekUseCase,
} from '.'

const useCases = [
  GetParentStudentScheduleWeekUseCase,
  GetParentStudentScheduleSessionDetailUseCase,
  GetParentStudentNextScheduleOverviewUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentScheduleApplicationModule {}
