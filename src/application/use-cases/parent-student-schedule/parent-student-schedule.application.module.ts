import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
  GetParentStudentNextScheduleSessionUseCase,
  GetParentStudentScheduleSessionDetailUseCase,
  GetParentStudentScheduleWeekUseCase,
} from '.'

const useCases = [
  GetParentStudentScheduleWeekUseCase,
  GetParentStudentScheduleSessionDetailUseCase,
  GetParentStudentNextScheduleSessionUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentScheduleApplicationModule {}
