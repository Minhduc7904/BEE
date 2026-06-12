import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as studentLearningItemUseCase from './'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

const STUDENT_LEARNING_ITEM_USE_CASES = [
  studentLearningItemUseCase.MarkStudentLearningItemLearnedUseCase,
  StudentClassLessonAccessService,
]

@Module({
  imports: [
    InfrastructureModule,
  ],
  providers: STUDENT_LEARNING_ITEM_USE_CASES,
  exports: STUDENT_LEARNING_ITEM_USE_CASES,
})
export class StudentLearningItemApplicationModule {}
