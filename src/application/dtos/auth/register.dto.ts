import { IsString, IsEmail, MinLength, IsOptional, Matches, IsInt, Min, Max, IsDateString } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES, PHONE_VN_REGEX } from '../../../shared/constants'
import { BaseResponseDto, ErrorResponseDto, StudentResponseDto, AdminResponseDto } from '..'
import { IsEnumValue } from '../../../shared/decorators'
import { Gender } from 'src/shared/enums'

export class RegisterAdminDto {
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
  username: string

  @Trim()
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
  email?: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
  password: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
  firstName: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
  lastName: string

  @Trim()
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
  subjectId?: number
}

export class RegisterStudentDto {
  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
  username: string

  @Trim()
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
  email?: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
  @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
  password: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
  firstName: string

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
  lastName: string

  // NEW: gender
  @IsOptional()
  @IsEnumValue(Gender, { message: VALIDATION_MESSAGES.FIELD_INVALID('Giới tính') })
  gender?: Gender

  @IsOptional()
  @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày sinh') })
  dateOfBirth?: Date

  @Trim()
  @IsOptional()
  @Matches(PHONE_VN_REGEX, {
    message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại học sinh'),
  })
  studentPhone?: string

  @Trim()
  @IsOptional()
  @Matches(PHONE_VN_REGEX, {
    message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại phụ huynh'),
  })
  parentPhone?: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trường') })
  school?: string

  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Khối lớp') })
  @Min(6, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối lớp', 6) })
  @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối lớp', 12) })
  grade: number
}

export class RegisterAdminResponseDto extends BaseResponseDto<AdminResponseDto> {
  declare data: AdminResponseDto
}
