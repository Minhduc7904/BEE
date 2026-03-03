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
    GetCompetitionRankingUseCase,
    GetCompetitionQuestionStatsUseCase,
} from './index'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'

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
        GetCompetitionRankingUseCase,
        GetCompetitionQuestionStatsUseCase,
        AttachMediaFromContentUseCase,
        ProcessContentWithPresignedUrlsUseCase,
    ],
    exports: [
        CreateCompetitionUseCase,
        UpdateCompetitionUseCase,
        DeleteCompetitionUseCase,
        GetAllCompetitionsUseCase,
        GetCompetitionByIdUseCase,
        SearchCompetitionsUseCase,
        GetCompetitionRankingUseCase,
        GetCompetitionQuestionStatsUseCase,
    ],
})
export class CompetitionApplicationModule { }
