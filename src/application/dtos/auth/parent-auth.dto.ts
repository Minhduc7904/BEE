import { Parent } from '../../../domain/entities/user/parent.entity'
import { Student } from '../../../domain/entities/user/student.entity'
import {
  IsOptionalString,
  IsRequiredLocalPhoneVN,
  IsRequiredString,
  IsRequiredUniqueIntArray,
} from '../../../shared/decorators/validate'

export class CheckParentPhoneRequestDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string
}

export class RegisterParentDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string

  @IsRequiredString('Mật khẩu', 100, 6)
  password: string

  @IsRequiredString('Tên', 50)
  firstName: string

  @IsRequiredString('Họ', 100)
  lastName: string

  @IsRequiredUniqueIntArray('Danh sách học sinh')
  studentIds: number[]
}

export class LoginParentRequestDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string

  @IsRequiredString('Mật khẩu', 100, 6)
  password: string

  @IsOptionalString('User Agent', 255)
  userAgent?: string

  @IsOptionalString('Địa chỉ IP', 45)
  ipAddress?: string

  @IsOptionalString('Dấu vân tay thiết bị', 128)
  deviceFingerprint?: string
}

export class ParentStudentSummaryDto {
  studentId: number
  fullName: string
  grade: number
  school?: string

  static fromStudent(student: Student): ParentStudentSummaryDto {
    return {
      studentId: student.studentId,
      fullName: student.getFullName(),
      grade: student.grade,
      school: student.school,
    }
  }

  static fromStudents(students: Student[]): ParentStudentSummaryDto[] {
    return students.map((student) => this.fromStudent(student))
  }
}

export class CheckParentPhoneResponseDto {
  canLogin: boolean
  canRegister: boolean
  students: ParentStudentSummaryDto[]
}

export class ParentResponseDto {
  userId: number
  parentId: number
  phone: string
  firstName: string
  lastName: string
  fullName: string
  isActive: boolean
  students: ParentStudentSummaryDto[]

  static fromParent(parent: Parent): ParentResponseDto {
    if (!parent.user) {
      throw new Error('Parent entity must include user details')
    }

    const students = (parent.studentLinks ?? [])
      .map((link) => link.student)
      .filter((student): student is Student => student !== undefined)

    return {
      userId: parent.userId,
      parentId: parent.parentId,
      phone: parent.phone,
      firstName: parent.user.firstName,
      lastName: parent.user.lastName,
      fullName: parent.user.getFullName(),
      isActive: parent.user.isActive,
      students: ParentStudentSummaryDto.fromStudents(students),
    }
  }
}
