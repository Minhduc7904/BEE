// src/application/use-cases/competition-submit/competition-submit.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
    GetCompetitionRemainingTimeUseCase,
    StartCompetitionAttemptUseCase,
    GetCompetitionExamUseCase,
    GetCompetitionAnswersUseCase,
    SubmitCompetitionAnswerUseCase,
    FinishCompetitionSubmitUseCase,
    GetAllCompetitionSubmitsUseCase,
    GetCompetitionSubmitByIdUseCase,
    DeleteCompetitionSubmitUseCase,
    GetStudentCompetitionHistoryUseCase,
    GetAdminCompetitionSubmitDetailUseCase,
    RegradeCompetitionSubmitUseCase,
} from './index'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'

@Module({
    imports: [
        InfrastructureModule, // 🔥 BẮT BUỘC - provides repositories
    ],
    providers: [
        GetCompetitionRemainingTimeUseCase,
        StartCompetitionAttemptUseCase,
        GetCompetitionExamUseCase,
        GetCompetitionAnswersUseCase,
        SubmitCompetitionAnswerUseCase,
        FinishCompetitionSubmitUseCase,
        GetAllCompetitionSubmitsUseCase,
        GetCompetitionSubmitByIdUseCase,
        DeleteCompetitionSubmitUseCase,
        GetStudentCompetitionHistoryUseCase,
        GetAdminCompetitionSubmitDetailUseCase,
        RegradeCompetitionSubmitUseCase,
        ProcessContentWithPresignedUrlsUseCase,
    ],
    exports: [
        GetCompetitionRemainingTimeUseCase,
        StartCompetitionAttemptUseCase,
        GetCompetitionExamUseCase,
        GetCompetitionAnswersUseCase,
        SubmitCompetitionAnswerUseCase,
        FinishCompetitionSubmitUseCase,
        GetAllCompetitionSubmitsUseCase,
        GetCompetitionSubmitByIdUseCase,
        DeleteCompetitionSubmitUseCase,
        GetStudentCompetitionHistoryUseCase,
        GetAdminCompetitionSubmitDetailUseCase,
        RegradeCompetitionSubmitUseCase,
    ],
})
export class CompetitionSubmitApplicationModule { }

