// src/application/dtos/student/student-response.dto.ts
import { UserResponseDto, UpdateUserDto } from '../user/user.dto'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { RoleResponseDto } from '../role/role.dto'
import { IsOptional, IsString, IsInt, Min, Max, Matches } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
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

export class UpdateStudentDto extends UpdateUserDto {
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại sinh viên') })
  @Matches(/^[0-9]{10,11}$/, { message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại sinh viên') })
  studentPhone?: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại phụ huynh') })
  @Matches(/^[0-9]{10,11}$/, { message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại phụ huynh') })
  parentPhone?: string

  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Khối lớp') })
  @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối lớp', 1) })
  @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối lớp', 12) })
  grade?: number

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trường học') })
  school?: string
}
