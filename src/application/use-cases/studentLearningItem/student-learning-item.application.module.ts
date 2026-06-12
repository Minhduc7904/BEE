import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as studentLearningItemUseCase from './'

const STUDENT_LEARNING_ITEM_USE_CASES = [
  studentLearningItemUseCase.MarkStudentLearningItemLearnedUseCase,
]

@Module({
  imports: [
    InfrastructureModule,
  ],
  providers: STUDENT_LEARNING_ITEM_USE_CASES,
  exports: STUDENT_LEARNING_ITEM_USE_CASES,
})
export class StudentLearningItemApplicationModule {}
