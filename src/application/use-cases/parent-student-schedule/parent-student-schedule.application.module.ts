import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { GetParentStudentScheduleSessionDetailUseCase, GetParentStudentScheduleWeekUseCase } from '.'

const useCases = [GetParentStudentScheduleWeekUseCase, GetParentStudentScheduleSessionDetailUseCase]

@Module({
  imports: [InfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentScheduleApplicationModule {}
