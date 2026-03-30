import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { CreatePublicStudentExamAttemptUseCase } from './create-public-student-exam-attempt.use-case'
import { GetPublicStudentExamAttemptDetailUseCase } from './get-public-student-exam-attempt-detail.use-case'
import { GetPublicStudentExamAttemptsUseCase } from './get-public-student-exam-attempts.use-case'
import { GetPublicStudentExamAttemptResultUseCase } from './get-public-student-exam-attempt-result.use-case'
import { SubmitPublicStudentExamAttemptUseCase } from './submit-public-student-exam-attempt.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

@Module({
  imports: [InfrastructureModule],
  providers: [
    GetPublicStudentExamAttemptsUseCase,
    GetPublicStudentExamAttemptDetailUseCase,
    GetPublicStudentExamAttemptResultUseCase,
    CreatePublicStudentExamAttemptUseCase,
    SubmitPublicStudentExamAttemptUseCase,
    ProcessContentWithPresignedUrlsUseCase,
    ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
  ],
  exports: [
    GetPublicStudentExamAttemptsUseCase,
    GetPublicStudentExamAttemptDetailUseCase,
    GetPublicStudentExamAttemptResultUseCase,
    CreatePublicStudentExamAttemptUseCase,
    SubmitPublicStudentExamAttemptUseCase,
  ],
})
export class ExamAttemptApplicationModule {}
