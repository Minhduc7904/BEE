// src/application/use-cases/competition/competition.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
    CreateCompetitionUseCase,
    UpdateCompetitionUseCase,
    DeleteCompetitionUseCase,
    GetAllCompetitionsUseCase,
    GetCompetitionByIdUseCase,
    SearchCompetitionsUseCase,
    GetPublicStudentCompetitionsUseCase,
    GetPublicStudentCompetitionDetailUseCase,
    GetPublicStudentCompetitionExamUseCase,
    GetPublicStudentCompetitionHistoryUseCase,
    GetPublicStudentCompetitionSubmitHistoryUseCase,
    GetCompetitionRankingUseCase,
    GetCompetitionLeaderboardUseCase,
    GetCompetitionQuestionStatsUseCase,
} from './index'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

@Module({
    imports: [
        InfrastructureModule, // 🔥 BẮT BUỘC
    ],
    providers: [
        CreateCompetitionUseCase,
        UpdateCompetitionUseCase,
        DeleteCompetitionUseCase,
        GetAllCompetitionsUseCase,
        GetCompetitionByIdUseCase,
        SearchCompetitionsUseCase,
        GetPublicStudentCompetitionsUseCase,
        GetPublicStudentCompetitionDetailUseCase,
        GetPublicStudentCompetitionExamUseCase,
        GetPublicStudentCompetitionHistoryUseCase,
        GetPublicStudentCompetitionSubmitHistoryUseCase,
        GetCompetitionRankingUseCase,
        GetCompetitionLeaderboardUseCase,
        GetCompetitionQuestionStatsUseCase,
        AttachMediaFromContentUseCase,
        ProcessContentWithPresignedUrlsUseCase,
        ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    ],
    exports: [
        CreateCompetitionUseCase,
        UpdateCompetitionUseCase,
        DeleteCompetitionUseCase,
        GetAllCompetitionsUseCase,
        GetCompetitionByIdUseCase,
        SearchCompetitionsUseCase,
        GetPublicStudentCompetitionsUseCase,
        GetPublicStudentCompetitionDetailUseCase,
        GetPublicStudentCompetitionExamUseCase,
        GetPublicStudentCompetitionHistoryUseCase,
        GetPublicStudentCompetitionSubmitHistoryUseCase,
        GetCompetitionRankingUseCase,
        GetCompetitionLeaderboardUseCase,
        GetCompetitionQuestionStatsUseCase,
    ],
})
export class CompetitionApplicationModule { }
