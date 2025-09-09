import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber, Min, IsDateString, IsBoolean } from "class-validator";
import { RoleResponseDto } from "./role.dto";
import { SWAGGER_PROPERTIES } from "../../../shared/constants/swagger-properties.constants";
import { VALIDATION_MESSAGES } from "../../../shared/constants/validation-messages";

export class AssignUserRoleDto {
    @ApiProperty(SWAGGER_PROPERTIES.USER_ID)
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('User ID') })
    @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('User ID', 1) })
    userId: number;

    @ApiProperty(SWAGGER_PROPERTIES.ROLE_ID)
    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_REQUIRED('Role ID') })
    @Min(1, { message: VALIDATION_MESSAGES.FIELD_MIN_VALUE('Role ID', 1) })
    roleId: number;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EXPIRES_AT)
    @IsOptional()
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Thời gian hết hạn') })
    expiresAt?: string;
}

export class UpdateUserRoleDto {
    @ApiPropertyOptional(SWAGGER_PROPERTIES.EXPIRES_AT)
    @IsOptional()
    @IsDateString({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Thời gian hết hạn') })
    expiresAt?: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.IS_ACTIVE)
    @IsOptional()
    @IsBoolean({ message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái active') })
    isActive?: boolean;
}

export class UserRoleResponseDto {
    @ApiProperty(SWAGGER_PROPERTIES.USER_ID)
    userId: number;

    @ApiProperty(SWAGGER_PROPERTIES.ROLE_ID)
    roleId: number;

    @ApiProperty(SWAGGER_PROPERTIES.ASSIGNED_AT)
    assignedAt: Date;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.EXPIRES_AT)
    expiresAt?: Date;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.ASSIGNED_BY)
    assignedBy?: number;

    @ApiProperty(SWAGGER_PROPERTIES.IS_ACTIVE)
    isActive: boolean;

    @ApiPropertyOptional({
        description: 'Thông tin role',
        type: () => RoleResponseDto
    })
    role?: RoleResponseDto;

    @ApiPropertyOptional({
        description: 'Thông tin user được cấp role'
    })
    user?: {
        userId: number;
        username: string;
        firstName: string;
        lastName: string;
        email?: string;
    };

    @ApiPropertyOptional({
        description: 'Thông tin user đã cấp role'
    })
    assignedByUser?: {
        userId: number;
        username: string;
        firstName: string;
        lastName: string;
    };
}

export class UserRoleListResponseDto {
    @ApiProperty({
        description: 'Danh sách user roles',
        type: [UserRoleResponseDto]
    })
    data: UserRoleResponseDto[];

    @ApiProperty(SWAGGER_PROPERTIES.TOTAL)
    total: number;

    @ApiProperty(SWAGGER_PROPERTIES.PAGE)
    page: number;

    @ApiProperty(SWAGGER_PROPERTIES.LIMIT)
    limit: number;
}
