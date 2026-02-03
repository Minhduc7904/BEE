import { IsInt, Min, Max, MinLength } from 'class-validator'
import { BaseResponseDto, StudentResponseDto, AdminResponseDto } from '..'
import { 
  IsRequiredString, 
  IsOptionalString, 
  IsOptionalEmail, 
  IsOptionalNumber,
  IsOptionalEnumValue,
  IsOptionalDate,
  IsOptionalIntArray,
  IsRequiredNumber,
  IsOptionalPhoneVN
} from 'src/shared/decorators/validate'
import { Gender } from 'src/shared/enums'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

/**
 * DTO for admin registration
 * 
 * Required fields:
 * - Username (Tên đăng nhập)
 * - Password (Mật khẩu)
 * - First Name (Họ)
 * - Last Name (Tên)
 * 
 * Optional fields:
 * - Email
 * - Subject ID (Môn học)
 * - Role IDs (Danh sách vai trò)
 */
export class RegisterAdminDto {
  // Account credentials
  /**
   * Admin username
   * @required
   */
  @IsRequiredString('Tên đăng nhập')
  username: string

  /**
   * Admin email
   * @optional
   */
  @IsOptionalEmail('Email')
  email?: string

  /**
   * Admin password
   * @required
   * @minLength 6
   */
  @IsRequiredString('Mật khẩu')
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Mật khẩu', 6) })
  password: string

  // Personal information
  /**
   * Admin first name
   * @required
   */
  @IsRequiredString('Họ')
  firstName: string

  /**
   * Admin last name
   * @required
   */
  @IsRequiredString('Tên')
  lastName: string

  // Role and permissions
  /**
   * Subject ID that admin teaches
   * @optional
   */
  @IsOptionalNumber('Môn học')
  subjectId?: number

  /**
   * List of role IDs assigned to admin
   * @optional
   */
  @IsOptionalIntArray('Danh sách vai trò')
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Danh sách vai trò'), each: true })
  roleIds?: number[]
}

/**
 * DTO for student registration
 * 
 * Required fields:
 * - Username (Tên đăng nhập)
 * - Password (Mật khẩu)
 * - First Name (Họ)
 * - Last Name (Tên)
 * - Grade (Khối lớp)
 * 
 * Optional fields:
 * - Email
 * - Gender (Giới tính)
 * - Date of Birth (Ngày sinh)
 * - Student Phone (SĐT học sinh)
 * - Parent Phone (SĐT phụ huynh)
 * - School (Trường)
 * - Course IDs (Danh sách khóa học)
 * - Class IDs (Danh sách lớp học)
 * - Session IDs (Danh sách buổi học)
 */
export class RegisterStudentDto {
  // Account credentials
  /**
   * Student username
   * @required
   */
  @IsRequiredString('Tên đăng nhập')
  username: string

  /**
   * Student email
   * @optional
   */
  @IsOptionalEmail('Email')
  email?: string

  /**
   * Student password
   * @required
   * @minLength 6
   */
  @IsRequiredString('Mật khẩu')
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN_LENGTH('Mật khẩu', 6) })
  password: string

  // Personal information
  /**
   * Student first name
   * @required
   */
  @IsRequiredString('Họ')
  firstName: string

  /**
   * Student last name
   * @required
   */
  @IsRequiredString('Tên')
  lastName: string

  /**
   * Student gender
   * @optional
   */
  @IsOptionalEnumValue(Gender, 'Giới tính')
  gender?: Gender

  /**
   * Student date of birth
   * @optional
   */
  @IsOptionalDate('Ngày sinh')
  dateOfBirth?: Date

  // Contact information
  /**
   * Student phone number (Vietnamese format)
   * @optional
   */
  @IsOptionalPhoneVN('Số điện thoại học sinh')
  studentPhone?: string

  /**
   * Parent phone number (Vietnamese format)
   * @optional
   */
  @IsOptionalPhoneVN('Số điện thoại phụ huynh')
  parentPhone?: string

  // School information
  /**
   * School name
   * @optional
   */
  @IsOptionalString('Trường')
  school?: string

  /**
   * Grade level (1-12)
   * @required
   */
  @IsRequiredNumber('Khối lớp', 1, 12)
  grade: number

  // Course enrollment
  /**
   * List of course IDs to enroll
   * @optional
   */
  @IsOptionalIntArray('Danh sách khóa học')
  courseIds?: number[]

  /**
   * List of class IDs to join
   * @optional
   */
  @IsOptionalIntArray('Danh sách lớp học')
  classIds?: number[]

  /**
   * List of session IDs to attend
   * @optional
   */
  @IsOptionalIntArray('Danh sách buổi học')
  sessionIds?: number[]
}

/**
 * Response DTO after admin registration
 */
export class RegisterAdminResponseDto extends BaseResponseDto<AdminResponseDto> {
  declare data: AdminResponseDto
}
