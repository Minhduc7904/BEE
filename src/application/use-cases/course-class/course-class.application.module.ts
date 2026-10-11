import { Module } from '@nestjs/common'

import * as courseClassUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { SessionMakeupRegistrationSyncService } from 'src/application/services/session-makeup-registration-sync.service'

const COURSE_CLASS_USE_CASES = [
  courseClassUseCase.GetAllCourseClassUseCase,
  courseClassUseCase.GetCourseClassByIdUseCase,
  courseClassUseCase.CreateCourseClassUseCase,
  courseClassUseCase.UpdateCourseClassUseCase,
  courseClassUseCase.DeleteCourseClassUseCase,
  courseClassUseCase.SearchCourseClassesUseCase,
  courseClassUseCase.GetCourseClassMakeupGroupUseCase,
  courseClassUseCase.GetCourseClassMakeupSessionsUseCase,
  courseClassUseCase.ReplaceCourseClassMakeupGroupUseCase,
  SessionMakeupRegistrationSyncService,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: COURSE_CLASS_USE_CASES,
  exports: COURSE_CLASS_USE_CASES,
})
export class CourseClassApplicationModule {}
