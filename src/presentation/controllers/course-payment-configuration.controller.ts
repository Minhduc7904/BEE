import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common'
import {
  BaseResponseDto,
  CoursePaymentConfigurationResponseDto,
  UpdateCoursePaymentConfigurationDto,
} from '../../application/dtos'
import {
  GetCoursePaymentConfigurationUseCase,
  UpdateCoursePaymentConfigurationUseCase,
} from '../../application/use-cases/course-payment/course-payment-configuration.use-cases'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/course-payment-configuration')
export class CoursePaymentConfigurationController {
  constructor(
    private readonly getCoursePaymentConfigurationUseCase: GetCoursePaymentConfigurationUseCase,
    private readonly updateCoursePaymentConfigurationUseCase: UpdateCoursePaymentConfigurationUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.COURSE_PAYMENT_CONFIGURATION.MANAGE)
  @HttpCode(HttpStatus.OK)
  getConfiguration(): Promise<BaseResponseDto<CoursePaymentConfigurationResponseDto>> {
    return ExceptionHandler.execute(() => this.getCoursePaymentConfigurationUseCase.execute())
  }

  @Put()
  @RequirePermission(PERMISSION_CODES.COURSE_PAYMENT_CONFIGURATION.MANAGE)
  @HttpCode(HttpStatus.OK)
  updateConfiguration(
    @Body() dto: UpdateCoursePaymentConfigurationDto,
  ): Promise<BaseResponseDto<CoursePaymentConfigurationResponseDto>> {
    return ExceptionHandler.execute(() => this.updateCoursePaymentConfigurationUseCase.execute(dto))
  }
}
