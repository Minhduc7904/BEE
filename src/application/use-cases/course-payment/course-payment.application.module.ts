import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
  CreateCoursePaymentInstructionsUseCase,
  GetCoursePaymentConfigurationUseCase,
  UpdateCoursePaymentConfigurationUseCase,
  ConfirmManualCoursePaymentUseCase,
  GetMyCoursePaymentIntentStatusUseCase,
} from './'

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateCoursePaymentInstructionsUseCase,
    GetCoursePaymentConfigurationUseCase,
    UpdateCoursePaymentConfigurationUseCase,
    ConfirmManualCoursePaymentUseCase,
    GetMyCoursePaymentIntentStatusUseCase,
  ],
  exports: [
    CreateCoursePaymentInstructionsUseCase,
    GetCoursePaymentConfigurationUseCase,
    UpdateCoursePaymentConfigurationUseCase,
    ConfirmManualCoursePaymentUseCase,
    GetMyCoursePaymentIntentStatusUseCase,
  ],
})
export class CoursePaymentApplicationModule {}
