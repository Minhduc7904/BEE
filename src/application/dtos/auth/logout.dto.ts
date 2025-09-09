// src/application/dtos/auth/logout.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';

export class LogoutRequestDto {
    @ApiProperty(SWAGGER_PROPERTIES.REFRESH_TOKEN)
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Refresh token') })
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Refresh token') })
    refreshToken: string;
}

export class LogoutResponseDto {
    @ApiProperty(SWAGGER_PROPERTIES.LOGOUT_MESSAGE)
    message: string;
}
