import { IsRequiredIdNumber } from '../../../shared/decorators/validate'

export class UpdateCoursePaymentConfigurationDto {
  @IsRequiredIdNumber('ID tài khoản nhận tiền')
  receivingBankAccountId: number
}

export class CoursePaymentConfigurationResponseDto {
  receivingBankAccountId: number
  createdAt: Date
  updatedAt: Date
}
