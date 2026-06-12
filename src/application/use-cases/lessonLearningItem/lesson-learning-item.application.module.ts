import { Module } from '@nestjs/common'

import * as lessonLearningItemUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

const LESSON_LEARNING_ITEM_USE_CASES = [
  lessonLearningItemUseCase.GetAllLessonLearningItemUseCase,
  lessonLearningItemUseCase.GetLessonLearningItemByIdUseCase,
  lessonLearningItemUseCase.CreateLessonLearningItemUseCase,
  lessonLearningItemUseCase.DeleteLessonLearningItemUseCase,
  lessonLearningItemUseCase.ReorderLessonLearningItemsUseCase,
  lessonLearningItemUseCase.GetStudentLessonLearningItemsUseCase,
  lessonLearningItemUseCase.GetStudentLessonLearningItemByIdUseCase,
  StudentClassLessonAccessService,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: LESSON_LEARNING_ITEM_USE_CASES,
  exports: LESSON_LEARNING_ITEM_USE_CASES,
})
export class LessonLearningItemApplicationModule {}
