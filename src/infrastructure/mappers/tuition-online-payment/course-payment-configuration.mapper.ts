import type { CoursePaymentConfiguration as PrismaCoursePaymentConfiguration } from '@prisma/client'
import { CoursePaymentConfiguration } from '../../../domain/entities/tuition-online-payment/course-payment-configuration.entity'

export class CoursePaymentConfigurationMapper {
  static toDomain(
    configuration: PrismaCoursePaymentConfiguration | null | undefined,
  ): CoursePaymentConfiguration | null {
    if (!configuration) return null
    return new CoursePaymentConfiguration(configuration)
  }
}
