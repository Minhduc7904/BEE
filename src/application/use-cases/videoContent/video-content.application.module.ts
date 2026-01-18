// src/application/use-cases/videoContent/video-content.application.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    GetAllVideoContentUseCase,
    GetVideoContentByIdUseCase,
    CreateVideoContentUseCase,
    UpdateVideoContentUseCase,
    DeleteVideoContentUseCase,
} from './index'

@Module({
    imports: [PrismaModule, InfrastructureModule],
    providers: [
        GetAllVideoContentUseCase,
        GetVideoContentByIdUseCase,
        CreateVideoContentUseCase,
        UpdateVideoContentUseCase,
        DeleteVideoContentUseCase,
    ],
    exports: [
        GetAllVideoContentUseCase,
        GetVideoContentByIdUseCase,
        CreateVideoContentUseCase,
        UpdateVideoContentUseCase,
        DeleteVideoContentUseCase,
    ],
})
export class VideoContentApplicationModule { }
