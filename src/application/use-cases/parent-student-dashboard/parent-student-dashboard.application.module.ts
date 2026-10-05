import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { GetParentStudentAttendanceSummaryUseCase, GetParentStudentOutstandingTuitionSummaryUseCase } from '.'

const useCases = [GetParentStudentAttendanceSummaryUseCase, GetParentStudentOutstandingTuitionSummaryUseCase]

@Module({
  imports: [InfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentDashboardApplicationModule {}
