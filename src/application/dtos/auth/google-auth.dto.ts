// src/application/dtos/auth/google-auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';

export class GoogleUserProfileDto {
    @ApiProperty(SWAGGER_PROPERTIES.GOOGLE_ID)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Google ID') })
    googleId: string;

    @ApiProperty({
        ...SWAGGER_PROPERTIES.EMAIL,
        description: 'Email của user từ Google'
    })
    @Trim()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email: string;

    @ApiProperty(SWAGGER_PROPERTIES.FIRST_NAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên') })
    firstName: string;

    @ApiProperty(SWAGGER_PROPERTIES.LAST_NAME)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Họ') })
    lastName: string;

    @ApiProperty({
        ...SWAGGER_PROPERTIES.AVATAR_URL,
        description: 'Avatar URL từ Google'
    })
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Avatar URL') })
    picture?: string;

    @ApiProperty({
        ...SWAGGER_PROPERTIES.VERIFIED_STATUS,
        description: 'Verified email status từ Google'
    })
    verified: boolean;
}

export class GoogleAuthResponseDto {
    @ApiProperty(SWAGGER_PROPERTIES.GOOGLE_LOGIN_MESSAGE)
    message: string;

    @ApiProperty(SWAGGER_PROPERTIES.ACCESS_TOKEN)
    accessToken: string;

    @ApiProperty(SWAGGER_PROPERTIES.REFRESH_TOKEN)
    refreshToken: string;

    @ApiProperty({
        description: 'Thông tin user',
        type: Object
    })
    user: {
        userId: number;
        email: string;
        firstName: string;
        lastName: string;
        username: string;
        userType: 'admin' | 'student';
    };
}
