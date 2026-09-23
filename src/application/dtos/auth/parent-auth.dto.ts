import { Parent } from '../../../domain/entities/user/parent.entity'
import { Student } from '../../../domain/entities/user/student.entity'
import { Gender } from '../../../shared/enums'
import { UpdateUserDto } from '../user/user.dto'
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
  avatarUrl: string | null
  gender: Gender | null

  static fromStudent(student: Student, avatarUrl: string | null = null): ParentStudentSummaryDto {
    return {
      studentId: student.studentId,
      fullName: student.user
        ? `${student.user.lastName} ${student.user.firstName}`.trim()
        : `Student #${student.studentId}`,
      grade: student.grade,
      school: student.school,
      avatarUrl,
      gender: student.user?.gender ?? null,
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
  email?: string
  gender?: Gender
  dateOfBirth?: Date
  isActive: boolean
  students: ParentStudentSummaryDto[]

  static fromParent(parent: Parent, students?: ParentStudentSummaryDto[]): ParentResponseDto {
    if (!parent.user) {
      throw new Error('Parent entity must include user details')
    }

    const linkedStudents = (parent.studentLinks ?? [])
      .map((link) => link.student)
      .filter((student): student is Student => student !== undefined)

    return {
      userId: parent.userId,
      parentId: parent.parentId,
      phone: parent.phone,
      firstName: parent.user.firstName,
      lastName: parent.user.lastName,
      fullName: `${parent.user.lastName} ${parent.user.firstName}`.trim(),
      email: parent.user.email,
      gender: parent.user.gender,
      dateOfBirth: parent.user.dateOfBirth,
      isActive: parent.user.isActive,
      students: students ?? ParentStudentSummaryDto.fromStudents(linkedStudents),
    }
  }
}

/**
 * DTO cập nhật thông tin phụ huynh
 * @description Chứa các trường có thể tự cập nhật của phụ huynh (extends UpdateUserDto).
 * Số điện thoại (phone) là định danh đăng nhập nên không cho tự đổi qua endpoint này.
 */
export class UpdateParentDto extends UpdateUserDto {}
