import { Module } from '@nestjs/common'

import * as courseClassUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const COURSE_CLASS_USE_CASES = [
  courseClassUseCase.GetAllCourseClassUseCase,
  courseClassUseCase.GetCourseClassByIdUseCase,
  courseClassUseCase.CreateCourseClassUseCase,
  courseClassUseCase.UpdateCourseClassUseCase,
  courseClassUseCase.DeleteCourseClassUseCase,
  courseClassUseCase.SearchCourseClassesUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: COURSE_CLASS_USE_CASES,
  exports: COURSE_CLASS_USE_CASES,
})
export class CourseClassApplicationModule {}
