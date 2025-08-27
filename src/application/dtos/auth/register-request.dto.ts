import { IsString, IsEmail, MinLength, IsOptional, Matches, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALIDATION_MESSAGES, PHONE_VN_REGEX } from '../../../shared/constants/validation-messages';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class RegisterAdminDto {
    @ApiProperty({
        description: 'Tên đăng nhập',
        example: 'admin123'
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên đăng nhập') })
    username: string;

    @ApiPropertyOptional({
        description: 'Email (không bắt buộc)',
        example: 'admin@example.com'
    })
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email?: string;

    @ApiProperty({
        description: 'Mật khẩu (tối thiểu 6 ký tự)',
        example: 'password123',
        minLength: 6
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mật khẩu') })
    @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
    password: string;

    @ApiProperty({
        description: 'Họ',
        example: 'Nguyễn'
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Họ') })
    firstName: string;

    @ApiProperty({
        description: 'Tên',
        example: 'Văn A'
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên') })
    lastName: string;

    @ApiProperty({
        description: 'Môn phụ trách',
        example: 'Toán học'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Môn phụ trách') })
    subject?: string;
}

export class RegisterStudentDto {
    @ApiProperty({
        description: 'Tên đăng nhập',
        example: 'student123'
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên đăng nhập') })
    username: string;

    @ApiPropertyOptional({
        description: 'Email (không bắt buộc)',
        example: 'student@example.com'
    })
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email?: string;

    @ApiProperty({
        description: 'Mật khẩu (tối thiểu 6 ký tự)',
        example: 'password123',
        minLength: 6
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mật khẩu') })
    @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
    password: string;

    @ApiProperty({
        description: 'Họ',
        example: 'Trần'
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Họ') })
    firstName: string;

    @ApiProperty({
        description: 'Tên',
        example: 'Thị B'
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên') })
    lastName: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại học sinh (không bắt buộc)',
        example: '0987654321',
        pattern: '^(\\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$'
    })
    @Trim()
    @IsOptional()
    @Matches(PHONE_VN_REGEX, {
        message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại học sinh')
    })
    studentPhone?: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại phụ huynh (không bắt buộc)',
        example: '0912345678',
        pattern: '^(\\+84|84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$'
    })
    @Trim()
    @IsOptional()
    @Matches(PHONE_VN_REGEX, {
        message: VALIDATION_MESSAGES.FIELD_INVALID('Số điện thoại phụ huynh')
    })
    parentPhone?: string;

    @ApiPropertyOptional({
        description: 'Trường THPT (không bắt buộc)',
        example: 'THPT Chu Văn An'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trường') })
    school?: string;

    @ApiProperty({
        description: 'Khối lớp (6-12)',
        example: 11,
        minimum: 6,
        maximum: 12
    })
    @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('Khối lớp') })
    @Min(6, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Khối lớp', 6) })
    @Max(12, { message: VALIDATION_MESSAGES.FIELD_MAX_VALUE('Khối lớp', 12) })
    grade: number;
}
