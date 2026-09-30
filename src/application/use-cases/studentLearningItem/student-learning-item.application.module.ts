import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as studentLearningItemUseCase from './'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'
import { StudentPointService } from 'src/application/services/student-point.service'
import { NotificationApplicationModule } from '../notification/notification.application.module'

const STUDENT_LEARNING_ITEM_USE_CASES = [
  studentLearningItemUseCase.MarkStudentLearningItemLearnedUseCase,
  StudentClassLessonAccessService,
  StudentPointService,
]

@Module({
  imports: [
    InfrastructureModule,
    NotificationApplicationModule,
  ],
  providers: STUDENT_LEARNING_ITEM_USE_CASES,
  exports: STUDENT_LEARNING_ITEM_USE_CASES,
})
export class StudentLearningItemApplicationModule {}
