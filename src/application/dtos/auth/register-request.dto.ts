import { IsString, IsEmail, MinLength, IsOptional, Matches, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALIDATION_MESSAGES, PHONE_VN_REGEX } from '../../../shared/constants/validation-messages';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';

export class RegisterAdminDto {
    @ApiProperty(SWAGGER_PROPERTIES.USERNAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
    username: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EMAIL)
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email?: string;

    @ApiProperty(SWAGGER_PROPERTIES.PASSWORD)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
    @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
    password: string;

    @ApiProperty(SWAGGER_PROPERTIES.FIRST_NAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
    firstName: string;

    @ApiProperty(SWAGGER_PROPERTIES.LAST_NAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
    lastName: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.SUBJECT)
    @Trim()
    @IsOptional()
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Môn học') })
    subjectId?: number;
}

export class RegisterStudentDto {
    @ApiProperty(SWAGGER_PROPERTIES.USERNAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
    username: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EMAIL)
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email?: string;

    @ApiProperty({
        ...SWAGGER_PROPERTIES.PASSWORD,
        minLength: 6
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
    @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
    password: string;

    @ApiProperty(SWAGGER_PROPERTIES.FIRST_NAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
    firstName: string;

    @ApiProperty(SWAGGER_PROPERTIES.LAST_NAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
    lastName: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.STUDENT_PHONE)
    @Trim()
    @IsOptional()
    @Matches(PHONE_VN_REGEX, {
        message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại học sinh')
    })
    studentPhone?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.PARENT_PHONE)
    @Trim()
    @IsOptional()
    @Matches(PHONE_VN_REGEX, {
        message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại phụ huynh')
    })
    parentPhone?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.SCHOOL)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trường') })
    school?: string;

    @ApiProperty(SWAGGER_PROPERTIES.GRADE_6_12)
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Khối lớp') })
    @Min(6, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối lớp', 6) })
    @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối lớp', 12) })
    grade: number;
}
