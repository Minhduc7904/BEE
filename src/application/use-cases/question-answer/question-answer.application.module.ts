import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { GetPublicStudentQuestionAnswersUseCase } from './get-public-student-question-answers.use-case'

@Module({
  imports: [InfrastructureModule],
  providers: [GetPublicStudentQuestionAnswersUseCase],
  exports: [GetPublicStudentQuestionAnswersUseCase],
})
export class QuestionAnswerApplicationModule {}
