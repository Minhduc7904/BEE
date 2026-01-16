import { Module } from '@nestjs/common'

import * as courseUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const COURSE_USE_CASES = [
  courseUseCase.GetAllCourseUseCase,
  courseUseCase.GetCourseByIdUseCase,
  courseUseCase.CreateCourseUseCase,
  courseUseCase.UpdateCourseUseCase,
  courseUseCase.DeleteCourseUseCase,
  courseUseCase.GetCourseStudentsAttendanceUseCase,
  courseUseCase.ExportCourseStudentsAttendanceUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: COURSE_USE_CASES,
  exports: COURSE_USE_CASES,
})
export class CourseApplicationModule {}
