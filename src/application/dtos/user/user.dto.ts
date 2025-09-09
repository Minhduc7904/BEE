// src/application/dtos/user/user-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';

export class UserResponseDto {
    @ApiProperty(SWAGGER_PROPERTIES.USER_ID)
    userId: number;

    @ApiProperty(SWAGGER_PROPERTIES.USERNAME)
    username: string;

    @ApiProperty(SWAGGER_PROPERTIES.EMAIL)
    email?: string;

    @ApiProperty(SWAGGER_PROPERTIES.FIRST_NAME)
    firstName: string;

    @ApiProperty(SWAGGER_PROPERTIES.LAST_NAME)
    lastName: string;

    @ApiProperty(SWAGGER_PROPERTIES.FULL_NAME)
    fullName: string;

    @ApiProperty(SWAGGER_PROPERTIES.IS_ACTIVE)
    isActive: boolean;

    @ApiProperty(SWAGGER_PROPERTIES.IS_EMAIL_VERIFIED)
    isEmailVerified: boolean;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EMAIL_VERIFIED_AT)
    emailVerifiedAt?: Date;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.LAST_LOGIN_AT)
    lastLoginAt?: Date;

    @ApiProperty(SWAGGER_PROPERTIES.CREATED_AT)
    createdAt: Date;

    @ApiProperty(SWAGGER_PROPERTIES.UPDATED_AT)
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
        ...SWAGGER_PROPERTIES.USERNAME,
        minLength: 3,
        maxLength: 50
    })
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Username') })
    @MinLength(3, { message: VALIDATION_MESSAGES.FIELD_MIN('Username', 3) })
    @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Username', 50) })
    username?: string;

    @ApiPropertyOptional({ 
        ...SWAGGER_PROPERTIES.EMAIL,
        maxLength: 120
    })
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    @MaxLength(120, { message: VALIDATION_MESSAGES.FIELD_MAX('Email', 120) })
    email?: string;

    @ApiPropertyOptional({ 
        ...SWAGGER_PROPERTIES.LAST_NAME,
        maxLength: 100
    })
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
    @MaxLength(100, { message: VALIDATION_MESSAGES.FIELD_MAX('Họ', 100) })
    lastName?: string;

    @ApiPropertyOptional({ 
        ...SWAGGER_PROPERTIES.FIRST_NAME,
        maxLength: 50
    })
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
    @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên', 50) })
    firstName?: string;
}
