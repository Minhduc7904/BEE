import { IsRequiredLocalPhoneVN } from '../../../../shared/decorators/validate'

export class GetParentRecoveryStudentsDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string
}

export class ParentRecoveryStudentDto {
  studentId: number
  fullName: string
  schoolOptions: string[]
  avatarUrl: string | null
}

export class GetParentRecoveryStudentsResultDto {
  students: ParentRecoveryStudentDto[]
}
