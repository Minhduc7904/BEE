import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { GetPublicStudentExamAttemptsUseCase } from './get-public-student-exam-attempts.use-case'

@Module({
  imports: [InfrastructureModule],
  providers: [GetPublicStudentExamAttemptsUseCase],
  exports: [GetPublicStudentExamAttemptsUseCase],
})
export class ExamAttemptApplicationModule {}
