// src/application/dtos/auth/google-auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/shared/decorators/trim.decorator';

export class GoogleUserProfileDto {
    @ApiProperty({
        description: 'Google ID của user',
        example: '123456789012345678901'
    })
    @Trim()
    @IsString()
    googleId: string;

    @ApiProperty({
        description: 'Email của user từ Google',
        example: 'user@gmail.com'
    })
    @Trim()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Tên của user',
        example: 'Nguyen Van A'
    })
    @Trim()
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'Họ của user',
        example: 'Nguyen'
    })
    @Trim()
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'Avatar URL từ Google',
        example: 'https://lh3.googleusercontent.com/...'
    })
    @Trim()
    @IsOptional()
    @IsString()
    picture?: string;

    @ApiProperty({
        description: 'Verified email status từ Google',
        example: true
    })
    verified: boolean;
}

export class GoogleAuthResponseDto {
    @ApiProperty({
        description: 'Thông báo kết quả',
        example: 'Đăng nhập Google thành công'
    })
    message: string;

    @ApiProperty({
        description: 'Access Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'Refresh Token',
        example: 'refresh_token_here...'
    })
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
