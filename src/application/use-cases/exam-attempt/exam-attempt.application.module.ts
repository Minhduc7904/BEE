import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { CreatePublicStudentExamAttemptUseCase } from './create-public-student-exam-attempt.use-case'
import { GetPublicStudentExamAttemptDetailUseCase } from './get-public-student-exam-attempt-detail.use-case'
import { GetPublicStudentExamAttemptsUseCase } from './get-public-student-exam-attempts.use-case'
import { SubmitPublicStudentExamAttemptUseCase } from './submit-public-student-exam-attempt.use-case'

@Module({
  imports: [InfrastructureModule],
  providers: [
    GetPublicStudentExamAttemptsUseCase,
    GetPublicStudentExamAttemptDetailUseCase,
    CreatePublicStudentExamAttemptUseCase,
    SubmitPublicStudentExamAttemptUseCase,
  ],
  exports: [
    GetPublicStudentExamAttemptsUseCase,
    GetPublicStudentExamAttemptDetailUseCase,
    CreatePublicStudentExamAttemptUseCase,
    SubmitPublicStudentExamAttemptUseCase,
  ],
})
export class ExamAttemptApplicationModule {}
