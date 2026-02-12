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
    ],
})
export class CompetitionApplicationModule { }
