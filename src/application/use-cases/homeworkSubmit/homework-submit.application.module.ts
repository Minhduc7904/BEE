// src/application/use-cases/homeworkSubmit/homework-submit.application.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    GetAllHomeworkSubmitUseCase,
    GetHomeworkSubmitByIdUseCase,
    CreateHomeworkSubmitUseCase,
    UpdateHomeworkSubmitUseCase,
    DeleteHomeworkSubmitUseCase,
    GradeHomeworkSubmitUseCase,
} from './index'

@Module({
    imports: [PrismaModule, InfrastructureModule],
    providers: [
        GetAllHomeworkSubmitUseCase,
        GetHomeworkSubmitByIdUseCase,
        CreateHomeworkSubmitUseCase,
        UpdateHomeworkSubmitUseCase,
        DeleteHomeworkSubmitUseCase,
        GradeHomeworkSubmitUseCase,
    ],
    exports: [
        GetAllHomeworkSubmitUseCase,
        GetHomeworkSubmitByIdUseCase,
        CreateHomeworkSubmitUseCase,
        UpdateHomeworkSubmitUseCase,
        DeleteHomeworkSubmitUseCase,
        GradeHomeworkSubmitUseCase,
    ],
})
export class HomeworkSubmitApplicationModule { }
