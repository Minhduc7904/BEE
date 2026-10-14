import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
  GetParentStudentCompetitionSubmissionDetailUseCase,
  GetParentStudentCompetitionSubmissionsUseCase,
  GetParentStudentCompetitionStatisticsUseCase,
  GetParentStudentHomeworkSubmissionDetailUseCase,
  GetParentStudentHomeworkSubmissionsUseCase,
  GetParentStudentHomeworkStatisticsUseCase,
  GetParentStudentResultsSummaryUseCase,
} from '.'

const useCases = [
  GetParentStudentHomeworkSubmissionsUseCase,
  GetParentStudentHomeworkStatisticsUseCase,
  GetParentStudentHomeworkSubmissionDetailUseCase,
  GetParentStudentCompetitionSubmissionsUseCase,
  GetParentStudentCompetitionStatisticsUseCase,
  GetParentStudentCompetitionSubmissionDetailUseCase,
  GetParentStudentResultsSummaryUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: useCases,
  exports: useCases,
})
export class ParentStudentResultsApplicationModule {}
