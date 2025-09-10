import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class LoginRequestDto {
    @ApiProperty(SWAGGER_PROPERTIES.USERNAME)
    @Trim()
    @IsOptional()
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên đăng nhập') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
    username?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EMAIL)
    @Trim()
    @IsOptional()
    @IsEmail({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Email') })
    email?: string;

    @ApiProperty(SWAGGER_PROPERTIES.PASSWORD)
    @Trim()
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mật khẩu') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
    @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
    password: string;
}

