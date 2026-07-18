// src/application/use-cases/homeworkSubmit/homework-submit.application.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import { MediaApplicationModule } from '../media/media.application.module'
import { LearningItemApplicationModule } from '../learningItem/learning-item.application.module'
import { CompetitionSubmitApplicationModule } from '../competition-submit/competition-submit.application.module'
import {
    GetAllHomeworkSubmitUseCase,
    GetHomeworkSubmitByIdUseCase,
    CreateHomeworkSubmitUseCase,
    UpdateHomeworkSubmitUseCase,
    DeleteHomeworkSubmitUseCase,
    GradeHomeworkSubmitUseCase,
    StudentFileHomeworkAccessService,
    UploadStudentHomeworkFilesUseCase,
    SubmitStudentFileHomeworkUseCase,
    GetAdminHomeworkSubmitDetailUseCase,
    GradeStudentFileHomeworkUseCase,
    GetMyHomeworkSubmitsUseCase,
    GetStudentHomeworkSubmitsUseCase,
    UpdateHomeworkSubmitImageAltUseCase,
    UngradeStudentFileHomeworkUseCase,
} from './index'

@Module({
    imports: [
        PrismaModule,
        InfrastructureModule,
        MediaApplicationModule,
        LearningItemApplicationModule,
        CompetitionSubmitApplicationModule,
    ],
    providers: [
        GetAllHomeworkSubmitUseCase,
        GetHomeworkSubmitByIdUseCase,
        CreateHomeworkSubmitUseCase,
        UpdateHomeworkSubmitUseCase,
        DeleteHomeworkSubmitUseCase,
        GradeHomeworkSubmitUseCase,
        StudentFileHomeworkAccessService,
        UploadStudentHomeworkFilesUseCase,
        SubmitStudentFileHomeworkUseCase,
        GetAdminHomeworkSubmitDetailUseCase,
        GradeStudentFileHomeworkUseCase,
        GetMyHomeworkSubmitsUseCase,
        GetStudentHomeworkSubmitsUseCase,
        UpdateHomeworkSubmitImageAltUseCase,
        UngradeStudentFileHomeworkUseCase,
    ],
    exports: [
        GetAllHomeworkSubmitUseCase,
        GetHomeworkSubmitByIdUseCase,
        CreateHomeworkSubmitUseCase,
        UpdateHomeworkSubmitUseCase,
        DeleteHomeworkSubmitUseCase,
        GradeHomeworkSubmitUseCase,
        UploadStudentHomeworkFilesUseCase,
        SubmitStudentFileHomeworkUseCase,
        GetAdminHomeworkSubmitDetailUseCase,
        GradeStudentFileHomeworkUseCase,
        GetMyHomeworkSubmitsUseCase,
        GetStudentHomeworkSubmitsUseCase,
        UpdateHomeworkSubmitImageAltUseCase,
        UngradeStudentFileHomeworkUseCase,
    ],
})
export class HomeworkSubmitApplicationModule { }
