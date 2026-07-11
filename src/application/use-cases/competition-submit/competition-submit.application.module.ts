// src/application/use-cases/competition-submit/competition-submit.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
  GetCompetitionRemainingTimeUseCase,
  StartCompetitionAttemptUseCase,
  GetCompetitionExamUseCase,
  PreviewCompetitionExamUseCase,
  GetCompetitionAnswersUseCase,
  SubmitCompetitionAnswerUseCase,
  FinishCompetitionSubmitUseCase,
  GetAllCompetitionSubmitsUseCase,
  GetCompetitionSubmitByIdUseCase,
  DeleteCompetitionSubmitUseCase,
  UpdateCompetitionSubmitUseCase,
  GetStudentCompetitionHistoryUseCase,
  GetAdminCompetitionSubmitDetailUseCase,
  RegradeCompetitionSubmitUseCase,
  GetStudentCompetitionResultUseCase,
  HandleHomeworkSubmitByCompetitionUseCase,
  GetCompetitionSubmitQuestionStatisticsUseCase,
  ExportCompetitionSubmitScoreListUseCase,
} from './index'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { StudentPointService } from '../../services/student-point.service'

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC - provides repositories
  ],
  providers: [
    GetCompetitionRemainingTimeUseCase,
    StartCompetitionAttemptUseCase,
    GetCompetitionExamUseCase,
    PreviewCompetitionExamUseCase,
    GetCompetitionAnswersUseCase,
    SubmitCompetitionAnswerUseCase,
    FinishCompetitionSubmitUseCase,
    GetAllCompetitionSubmitsUseCase,
    GetCompetitionSubmitByIdUseCase,
    DeleteCompetitionSubmitUseCase,
    UpdateCompetitionSubmitUseCase,
    GetStudentCompetitionHistoryUseCase,
    GetAdminCompetitionSubmitDetailUseCase,
    RegradeCompetitionSubmitUseCase,
    GetStudentCompetitionResultUseCase,
    HandleHomeworkSubmitByCompetitionUseCase,
    GetCompetitionSubmitQuestionStatisticsUseCase,
    ExportCompetitionSubmitScoreListUseCase,
    ProcessContentWithPresignedUrlsUseCase,
    ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    StudentPointService,
  ],
  exports: [
    GetCompetitionRemainingTimeUseCase,
    StartCompetitionAttemptUseCase,
    GetCompetitionExamUseCase,
    PreviewCompetitionExamUseCase,
    GetCompetitionAnswersUseCase,
    SubmitCompetitionAnswerUseCase,
    FinishCompetitionSubmitUseCase,
    GetAllCompetitionSubmitsUseCase,
    GetCompetitionSubmitByIdUseCase,
    DeleteCompetitionSubmitUseCase,
    UpdateCompetitionSubmitUseCase,
    GetStudentCompetitionHistoryUseCase,
    GetAdminCompetitionSubmitDetailUseCase,
    RegradeCompetitionSubmitUseCase,
    GetStudentCompetitionResultUseCase,
    HandleHomeworkSubmitByCompetitionUseCase,
    GetCompetitionSubmitQuestionStatisticsUseCase,
    ExportCompetitionSubmitScoreListUseCase,
  ],
})
export class CompetitionSubmitApplicationModule {}
