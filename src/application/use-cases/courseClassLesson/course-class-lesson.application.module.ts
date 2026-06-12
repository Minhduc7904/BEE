import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as courseClassLessonUseCase from './'

const COURSE_CLASS_LESSON_USE_CASES = [
  courseClassLessonUseCase.UpsertCourseClassLessonVisibilityUseCase,
]

@Module({
  imports: [
    InfrastructureModule,
  ],
  providers: COURSE_CLASS_LESSON_USE_CASES,
  exports: COURSE_CLASS_LESSON_USE_CASES,
})
export class CourseClassLessonApplicationModule { }
