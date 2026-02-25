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
        ProcessContentWithPresignedUrlsUseCase,
    ],
    exports: [
        GetCompetitionRemainingTimeUseCase,
        StartCompetitionAttemptUseCase,
        GetCompetitionExamUseCase,
        GetCompetitionAnswersUseCase,
        SubmitCompetitionAnswerUseCase,
        FinishCompetitionSubmitUseCase,
    ],
})
export class CompetitionSubmitApplicationModule { }
