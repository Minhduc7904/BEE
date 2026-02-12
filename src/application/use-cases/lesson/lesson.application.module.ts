import { Module } from '@nestjs/common'

import * as lessonUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const LESSON_USE_CASES = [
  lessonUseCase.GetAllLessonUseCase,
  lessonUseCase.GetLessonByIdUseCase,
  lessonUseCase.CreateLessonUseCase,
  lessonUseCase.UpdateLessonUseCase,
  lessonUseCase.DeleteLessonUseCase,
  lessonUseCase.GetStudentCourseLessonsUseCase,
  lessonUseCase.GetStudentLessonByIdUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: LESSON_USE_CASES,
  exports: LESSON_USE_CASES,
})
export class LessonApplicationModule {}
