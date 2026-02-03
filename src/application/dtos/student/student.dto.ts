// src/application/dtos/student/student-response.dto.ts
import { UserResponseDto, UpdateUserDto } from '../user/user.dto'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { RoleResponseDto } from '../role/role.dto'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { IsOptionalInt, IsOptionalPhoneVN, IsOptionalString } from 'src/shared/decorators/validate'
import { CourseEnrollmentResponseDto } from '../course-enrollment/course-enrollment.dto'
import { ClassStudentResponseDto } from '../class-student/class-student.dto'
export class StudentResponseDto extends UserResponseDto {
  studentId: number

  studentPhone?: string

  parentPhone?: string

  grade: number

  school?: string

  roles?: RoleResponseDto[]
  courseEnrollments?: CourseEnrollmentResponseDto[]
  classStudents?: ClassStudentResponseDto[]


  constructor(partial: Partial<StudentResponseDto>) {
    super(partial)
    Object.assign(this, partial)
  }

  /**
   * Factory method tạo từ User entity với Student details
   */
  static fromUserWithStudent(user: any, student: any): StudentResponseDto {
    const baseUser = UserResponseDto.fromUser(user)

    // Map roles từ user.userRoles nếu có
    const roles = user.userRoles?.map((ur: any) => ({
      roleId: ur.role?.roleId || ur.roleId,
      roleName: ur.role?.roleName || ur.roleName,
      description: ur.role?.description || ur.description,
      isAssignable: ur.role?.isAssignable ?? ur.isAssignable ?? true,
      requiredByRoleId: ur.role?.requiredByRoleId || ur.requiredByRoleId,
      createdAt: ur.role?.createdAt || ur.createdAt,
    })) || []

    return new StudentResponseDto({
      ...baseUser,
      studentId: student.studentId,
      studentPhone: student.studentPhone,
      parentPhone: student.parentPhone,
      grade: student.grade,
      school: student.school,
      roles,
      courseEnrollments: student.courseEnrollments,
      classStudents: student.classStudents,
    })
  }

  /**
   * Factory method tạo từ Student entity có include user
   */
  static fromStudentEntity(studentWithUser: any): StudentResponseDto {
    if (!studentWithUser.user) {
      throw new Error('Student entity must include user details')
    }

    return StudentResponseDto.fromUserWithStudent(studentWithUser.user, studentWithUser)
  }

  /**
   * Hiển thị thông tin trường học
   */
  get schoolDisplay(): string {
    return this.school || 'Chưa xác định'
  }

  /**
   * Hiển thị thông tin lớp
   */
  get gradeDisplay(): string {
    return `Lớp ${this.grade}`
  }
}

export class StudentListResponseDto extends PaginationResponseDto<StudentResponseDto> {
  declare data: StudentResponseDto[]
}

/**
 * DTO cập nhật thông tin học sinh
 * @description Chứa các trường có thể cập nhật của học sinh
 */
export class UpdateStudentDto extends UpdateUserDto {
  /**
   * Số điện thoại sinh viên (10-11 số)
   * @optional
   * @example "0987654321"
   */
  @IsOptionalPhoneVN('Số điện thoại sinh viên')
  studentPhone?: string

  /**
   * Số điện thoại phụ huynh (10-11 số)
   * @optional
   * @example "0912345678"
   */
  @IsOptionalPhoneVN('Số điện thoại phụ huynh')
  parentPhone?: string

  /**
   * Khối lớp (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối lớp', 1, 12)
  grade?: number

  /**
   * Trường học
   * @optional
   * @example "THPT Chuyên Lê Hồng Phong"
   */
  @IsOptionalString('Trường học')
  school?: string
}
