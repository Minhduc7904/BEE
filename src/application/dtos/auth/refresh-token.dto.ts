// src/application/dtos/auth/refresh-token.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class RefreshTokenRequestDto {
    @ApiProperty({
        description: 'Refresh Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    @Trim()
    @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Refresh token không được để trống' })
    refreshToken: string;
}

export class RefreshTokenResponseDto {
    @ApiProperty({
        description: 'JWT Access Token mới',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'Refresh Token mới',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Thời gian hết hạn Access Token (giây)',
        example: 3600
    })
    expiresIn: number;
}
