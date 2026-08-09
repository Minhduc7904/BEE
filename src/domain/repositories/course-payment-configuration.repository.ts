import { CoursePaymentConfiguration } from '../entities/tuition-online-payment/course-payment-configuration.entity'

export interface ICoursePaymentConfigurationRepository {
  findCurrent(): Promise<CoursePaymentConfiguration | null>
  upsert(receivingBankAccountId: number): Promise<CoursePaymentConfiguration>
}
