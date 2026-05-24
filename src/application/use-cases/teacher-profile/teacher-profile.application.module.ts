import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as teacherProfileUseCases from './'

const TEACHER_PROFILE_USE_CASES = [
  teacherProfileUseCases.CreateTeacherProfileUseCase,
  teacherProfileUseCases.GetTeacherProfilesUseCase,
  teacherProfileUseCases.GetTeacherProfileByIdUseCase,
  teacherProfileUseCases.GetTeacherProfileBySlugUseCase,
  teacherProfileUseCases.GetPublicSeoTeacherProfileBySlugUseCase,
  teacherProfileUseCases.IncrementPublicTeacherProfileViewCountUseCase,
  teacherProfileUseCases.UpdateTeacherProfileUseCase,
  teacherProfileUseCases.DeleteTeacherProfileUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: TEACHER_PROFILE_USE_CASES,
  exports: TEACHER_PROFILE_USE_CASES,
})
export class TeacherProfileApplicationModule {}
