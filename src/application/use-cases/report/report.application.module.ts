import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
  CreateReportUseCase,
  DeleteReportUseCase,
  GetMyReportsUseCase,
  GetReportByIdUseCase,
  GetReportsUseCase,
  UpdateReportUseCase,
} from '.'

const REPORT_USE_CASES = [
  CreateReportUseCase,
  GetReportsUseCase,
  GetMyReportsUseCase,
  GetReportByIdUseCase,
  UpdateReportUseCase,
  DeleteReportUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: REPORT_USE_CASES,
  exports: REPORT_USE_CASES,
})
export class ReportApplicationModule {}
