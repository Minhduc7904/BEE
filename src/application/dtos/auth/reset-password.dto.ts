import { ApiProperty } from "@nestjs/swagger";
import { SWAGGER_PROPERTIES } from "src/shared/constants";

export class ForgotPasswordDto {
    @ApiProperty(SWAGGER_PROPERTIES.EMAIL)
    email: string
}

export class ResetPasswordDto {
    token: string;
    newPassword: string;
}

export class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}

