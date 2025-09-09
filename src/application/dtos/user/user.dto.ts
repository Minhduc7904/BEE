// src/application/dtos/user/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, MaxLength, MinLength } from 'class-validator';

export class UserResponseDto {
    @ApiProperty({ description: 'ID của user', example: 1 })
    userId: number;

    @ApiProperty({ description: 'Tên đăng nhập', example: 'john_doe' })
    username: string;

    @ApiProperty({ description: 'Email', example: 'john@example.com', required: false })
    email?: string;

    @ApiProperty({ description: 'Họ', example: 'Nguyen' })
    firstName: string;

    @ApiProperty({ description: 'Tên', example: 'Van A' })
    lastName: string;

    @ApiProperty({ description: 'Họ và tên đầy đủ', example: 'Nguyen Van A' })
    fullName: string;

    @ApiProperty({ description: 'Trạng thái hoạt động', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Email đã được xác nhận', example: true })
    isEmailVerified: boolean;

    @ApiPropertyOptional({ description: 'Thời gian xác nhận email', example: '2024-01-01T00:00:00.000Z' })
    emailVerifiedAt?: Date;

    @ApiPropertyOptional({ description: 'Lần đăng nhập cuối', example: '2024-01-01T00:00:00.000Z' })
    lastLoginAt?: Date;

    @ApiProperty({ description: 'Ngày tạo', example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Ngày cập nhật', example: '2024-01-02T00:00:00.000Z' })
    updatedAt: Date;

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
    }

    /**
     * Factory method tạo từ User entity
     */
    static fromUser(user: any): UserResponseDto {
        return new UserResponseDto({
            userId: user.userId,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
}

export class UpdateUserDto {
    @ApiPropertyOptional({ 
        description: 'Tên đăng nhập mới',
        example: 'john_doe_new',
        minLength: 3,
        maxLength: 50
    })
    @IsOptional()
    @IsString({ message: 'Username phải là chuỗi ký tự' })
    @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự' })
    username?: string;

    @ApiPropertyOptional({ 
        description: 'Email mới',
        example: 'john.new@example.com',
        maxLength: 120
    })
    @IsOptional()
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @MaxLength(120, { message: 'Email không được vượt quá 120 ký tự' })
    email?: string;

    @ApiPropertyOptional({ 
        description: 'Họ mới',
        example: 'Tran',
        maxLength: 100
    })
    @IsOptional()
    @IsString({ message: 'Họ phải là chuỗi ký tự' })
    @MaxLength(100, { message: 'Họ không được vượt quá 100 ký tự' })
    lastName?: string;

    @ApiPropertyOptional({ 
        description: 'Tên mới',
        example: 'Van B',
        maxLength: 50
    })
    @IsOptional()
    @IsString({ message: 'Tên phải là chuỗi ký tự' })
    @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
    firstName?: string;
}
