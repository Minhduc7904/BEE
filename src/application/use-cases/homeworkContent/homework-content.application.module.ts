// src/application/use-cases/homeworkContent/homework-content.application.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    GetAllHomeworkContentUseCase,
    GetHomeworkContentByIdUseCase,
    GetHomeworkContentsByCourseUseCase,
    CreateHomeworkContentUseCase,
    UpdateHomeworkContentUseCase,
    DeleteHomeworkContentUseCase,
} from './index'

@Module({
    imports: [PrismaModule, InfrastructureModule],
    providers: [
        GetAllHomeworkContentUseCase,
        GetHomeworkContentByIdUseCase,
        GetHomeworkContentsByCourseUseCase,
        CreateHomeworkContentUseCase,
        UpdateHomeworkContentUseCase,
        DeleteHomeworkContentUseCase,
    ],
    exports: [
        GetAllHomeworkContentUseCase,
        GetHomeworkContentByIdUseCase,
        GetHomeworkContentsByCourseUseCase,
        CreateHomeworkContentUseCase,
        UpdateHomeworkContentUseCase,
        DeleteHomeworkContentUseCase,
    ],
})
export class HomeworkContentApplicationModule { }
