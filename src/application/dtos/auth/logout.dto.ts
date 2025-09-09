// src/application/dtos/auth/logout.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class LogoutRequestDto {
    @ApiProperty({ 
        description: 'Refresh token để revoke',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    @Trim()
    @IsString()
    @IsNotEmpty({ message: 'Refresh token là bắt buộc' })
    refreshToken: string;
}

export class LogoutResponseDto {
    @ApiProperty({ 
        description: 'Thông báo logout thành công',
        example: 'Đăng xuất thành công'
    })
    message: string;
}
