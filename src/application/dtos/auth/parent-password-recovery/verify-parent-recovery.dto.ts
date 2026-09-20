import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator'
import { IsRequiredIdNumber, IsRequiredLocalPhoneVN, IsRequiredString } from '../../../../shared/decorators/validate'

export class ParentRecoveryStudentAnswerDto {
  @IsRequiredIdNumber('ID học sinh')
  studentId: number

  @IsRequiredString('Trường học', 120)
  school: string

  @IsRequiredLocalPhoneVN('Số điện thoại học sinh')
  studentPhone: string

  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  parentPhone: string
}

export class VerifyParentRecoveryDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string

  @IsArray({ message: 'Danh sách xác minh học sinh không hợp lệ' })
  @ArrayMinSize(1, { message: 'Danh sách xác minh học sinh phải có ít nhất một phần tử' })
  @ValidateNested({ each: true })
  @Type(() => ParentRecoveryStudentAnswerDto)
  students: ParentRecoveryStudentAnswerDto[]
}

export class VerifyParentRecoveryResultDto {
  verified: boolean
  invalidStudentIds: number[]
  resetToken?: string
  expiresAt?: Date
}
