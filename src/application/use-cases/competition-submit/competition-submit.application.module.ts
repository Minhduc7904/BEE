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
} from './index'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

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
        ProcessContentWithPresignedUrlsUseCase,
        ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
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
    ],
})
export class CompetitionSubmitApplicationModule { }

