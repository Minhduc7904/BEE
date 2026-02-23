// src/application/use-cases/competition-submit/competition-submit.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
    GetCompetitionRemainingTimeUseCase,
    StartCompetitionAttemptUseCase,
} from './index'

@Module({
    imports: [
        InfrastructureModule, // 🔥 BẮT BUỘC - provides repositories
    ],
    providers: [
        GetCompetitionRemainingTimeUseCase,
        StartCompetitionAttemptUseCase,
    ],
    exports: [
        GetCompetitionRemainingTimeUseCase,
        StartCompetitionAttemptUseCase,
    ],
})
export class CompetitionSubmitApplicationModule { }
