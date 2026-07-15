import { Module } from '@nestjs/common'

import * as learningItemUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

const LEARNING_ITEM_USE_CASES = [
  learningItemUseCase.GetAllLearningItemUseCase,
  learningItemUseCase.GetLearningItemByIdUseCase,
  learningItemUseCase.GetStudentLearningItemByIdUseCase,
  learningItemUseCase.CreateLearningItemUseCase,
  learningItemUseCase.UpdateLearningItemUseCase,
  learningItemUseCase.DeleteLearningItemUseCase,
  learningItemUseCase.GetStudentHomeworksUseCase,
  learningItemUseCase.StreamStudentVideoUseCase,
  StudentClassLessonAccessService,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: LEARNING_ITEM_USE_CASES,
  exports: LEARNING_ITEM_USE_CASES,
})
export class LearningItemApplicationModule {}
