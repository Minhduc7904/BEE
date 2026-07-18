import { Module } from '@nestjs/common'

import * as lessonUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { LessonCourseClassLessonsService } from 'src/application/services/lesson-course-class-lessons.service'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

const LESSON_USE_CASES = [
  lessonUseCase.GetAllLessonUseCase,
  lessonUseCase.GetLessonByIdUseCase,
  lessonUseCase.CreateLessonUseCase,
  lessonUseCase.UpdateLessonUseCase,
  lessonUseCase.DeleteLessonUseCase,
  lessonUseCase.GetStudentCourseLessonsUseCase,
  lessonUseCase.GetStudentLatestLessonsUseCase,
  lessonUseCase.GetStudentLessonByIdUseCase,
  LessonCourseClassLessonsService,
  StudentClassLessonAccessService,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: LESSON_USE_CASES,
  exports: LESSON_USE_CASES,
})
export class LessonApplicationModule {}
