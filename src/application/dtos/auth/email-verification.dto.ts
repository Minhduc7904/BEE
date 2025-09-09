// src/application/dtos/auth/email-verification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { BaseResponseDto } from '../base-response.dto';

export class SendVerificationEmailRequestDto {
    @ApiProperty({
        description: 'ID của user cần gửi email xác nhận',
        example: 1,
    })
    userId: number; // Lấy từ params
}

export class VerifyEmailRequestDto {
    @ApiProperty({
        description: 'Token xác nhận email',
        example: 'abc123-def456-ghi789',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}

export class SendVerificationEmailResponseDto extends BaseResponseDto {
    @ApiProperty({
        description: 'Email đã được gửi tới',
        example: 'user@example.com',
    })
    emailSent: string;

    @ApiProperty({
        description: 'Thời gian hết hạn token',
        example: '2025-09-08T10:30:00Z',
    })
    expiresAt: Date;
}

export class VerifyEmailResponseDto extends BaseResponseDto {
    @ApiProperty({
        description: 'Email đã được xác nhận thành công',
        example: 'user@example.com',
    })
    emailVerified: string;

    @ApiProperty({
        description: 'Thời gian xác nhận',
        example: '2025-09-08T10:15:00Z',
    })
    verifiedAt: Date;
}
