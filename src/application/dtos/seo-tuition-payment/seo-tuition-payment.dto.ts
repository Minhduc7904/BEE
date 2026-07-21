import { Student } from '../../../domain/entities/user/student.entity'
import { IsRequiredIdNumber, IsRequiredPhoneVN } from '../../../shared/decorators/validate'
import { MyTuitionPaymentStatsQueryDto, TuitionPaymentListQueryDto } from '../tuition-payment'

export class SeoStudentSearchQueryDto {
  @IsRequiredPhoneVN('Số điện thoại tìm kiếm')
  phone: string
}

export class SeoParentPaymentAccessQueryDto {
  @IsRequiredPhoneVN('Số điện thoại phụ huynh')
  parentPhone: string
}

export class SeoTuitionPaymentListQueryDto extends TuitionPaymentListQueryDto {
  @IsRequiredPhoneVN('Số điện thoại phụ huynh')
  parentPhone: string
}

export class SeoTuitionPaymentStatsQueryDto extends MyTuitionPaymentStatsQueryDto {
  @IsRequiredPhoneVN('Số điện thoại phụ huynh')
  parentPhone: string
}

export class SeoStudentResponseDto {
  studentId: number
  fullName: string
  grade: number
  parentPhone: string

  static fromStudent(student: Student): SeoStudentResponseDto {
    return {
      studentId: student.studentId,
      fullName: student.getFullName(),
      grade: student.grade,
      parentPhone: student.parentPhone?.trim() ?? '',
    }
  }

  static fromStudents(students: Student[]): SeoStudentResponseDto[] {
    return students.map((student) => this.fromStudent(student))
  }
}

export class SeoPaymentIntentSocketPayload {
  @IsRequiredIdNumber('ID học sinh')
  studentId: number

  @IsRequiredPhoneVN('Số điện thoại phụ huynh')
  parentPhone: string

  @IsRequiredIdNumber('Payment intent ID')
  paymentIntentId: number
}
