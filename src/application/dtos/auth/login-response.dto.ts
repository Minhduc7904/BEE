import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../base-response.dto';
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants';

export class TokensDto {
    @ApiProperty(SWAGGER_PROPERTIES.ACCESS_TOKEN)
    accessToken: string;

    @ApiProperty(SWAGGER_PROPERTIES.REFRESH_TOKEN)
    refreshToken: string;

    @ApiProperty(SWAGGER_PROPERTIES.EXPIRES_IN)
    expiresIn: number;
}

export class UserInfoDto {
    @ApiProperty(SWAGGER_PROPERTIES.USER_ID)
    userId: number;

    @ApiProperty(SWAGGER_PROPERTIES.USERNAME)
    username: string;

    @ApiProperty({
        ...SWAGGER_PROPERTIES.EMAIL,
        required: false
    })
    email?: string;

    @ApiProperty(SWAGGER_PROPERTIES.FIRST_NAME)
    firstName: string;

    @ApiProperty(SWAGGER_PROPERTIES.LAST_NAME)
    lastName: string;

    @ApiProperty({
        ...SWAGGER_PROPERTIES.USER_TYPE,
        description: 'Vai trò'
    })
    role: 'admin' | 'student';

    @ApiProperty({ description: 'Thông tin chi tiết vai trò' })
    roleDetails?: {
        adminId?: number;
        subject?: string;
        studentId?: number;
        grade?: number;
        school?: string;
    };
}

export class LoginDataDto {
    @ApiProperty({ type: TokensDto })
    tokens: TokensDto;

    @ApiProperty({ type: UserInfoDto })
    user: UserInfoDto;
}

export class LoginResponseDto {
    @ApiProperty({ type: TokensDto })
    tokens: TokensDto;

    @ApiProperty({ type: UserInfoDto })
    user: UserInfoDto;
}
