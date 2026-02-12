import { Module } from '@nestjs/common'

import * as courseEnrollmentUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const COURSE_ENROLLMENT_USE_CASES = [
  courseEnrollmentUseCase.GetAllCourseEnrollmentUseCase,
  courseEnrollmentUseCase.GetStudentCourseEnrollmentsUseCase,
  courseEnrollmentUseCase.GetCourseEnrollmentByIdUseCase,
  courseEnrollmentUseCase.CreateCourseEnrollmentUseCase,
  courseEnrollmentUseCase.UpdateCourseEnrollmentUseCase,
  courseEnrollmentUseCase.DeleteCourseEnrollmentUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: COURSE_ENROLLMENT_USE_CASES,
  exports: COURSE_ENROLLMENT_USE_CASES,
})
export class CourseEnrollmentApplicationModule {}
