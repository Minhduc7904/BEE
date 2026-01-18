// src/application/use-cases/youtubeContent/youtube-content.application.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    GetAllYoutubeContentUseCase,
    GetYoutubeContentByIdUseCase,
    CreateYoutubeContentUseCase,
    UpdateYoutubeContentUseCase,
    DeleteYoutubeContentUseCase,
} from './index'

@Module({
    imports: [PrismaModule, InfrastructureModule],
    providers: [
        GetAllYoutubeContentUseCase,
        GetYoutubeContentByIdUseCase,
        CreateYoutubeContentUseCase,
        UpdateYoutubeContentUseCase,
        DeleteYoutubeContentUseCase,
    ],
    exports: [
        GetAllYoutubeContentUseCase,
        GetYoutubeContentByIdUseCase,
        CreateYoutubeContentUseCase,
        UpdateYoutubeContentUseCase,
        DeleteYoutubeContentUseCase,
    ],
})
export class YoutubeContentApplicationModule { }
