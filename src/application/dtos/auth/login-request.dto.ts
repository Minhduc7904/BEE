import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class LoginRequestDto {
    @ApiProperty({
        description: 'Tên đăng nhập',
        example: 'admin123'
    })
    @Trim()
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên đăng nhập') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Tên đăng nhập') })
    username: string;

    @ApiProperty({
        description: 'Mật khẩu',
        example: 'password123'
    })
    @Trim()
    @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Mật khẩu') })
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mật khẩu') })
    @MinLength(6, { message: VALIDATION_MESSAGES.FIELD_MIN('Mật khẩu', 6) })
    password: string;
}

