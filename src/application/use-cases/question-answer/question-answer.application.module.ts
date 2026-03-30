import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { GetPublicStudentQuestionAnswersUseCase } from './get-public-student-question-answers.use-case'
import { GetPublicStudentQuestionAnswersByAttemptUseCase } from './get-public-student-question-answers-by-attempt.use-case'
import { GetPublicStudentQuestionAnswerStatisticsUseCase } from './get-public-student-question-answer-statistics.use-case'
import { SubmitPublicStudentQuestionAnswerUseCase } from './submit-public-student-question-answer.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

@Module({
  imports: [InfrastructureModule],
  providers: [
    GetPublicStudentQuestionAnswersUseCase,
    GetPublicStudentQuestionAnswersByAttemptUseCase,
    GetPublicStudentQuestionAnswerStatisticsUseCase,
    SubmitPublicStudentQuestionAnswerUseCase,
    ProcessContentWithPresignedUrlsUseCase,
    ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
  ],
  exports: [
    GetPublicStudentQuestionAnswersUseCase,
    GetPublicStudentQuestionAnswersByAttemptUseCase,
    GetPublicStudentQuestionAnswerStatisticsUseCase,
    SubmitPublicStudentQuestionAnswerUseCase,
  ],
})
export class QuestionAnswerApplicationModule {}
