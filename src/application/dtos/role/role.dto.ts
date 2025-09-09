import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength, IsBoolean, IsNumber, Min } from "class-validator";
import { Trim } from "../../../shared/decorators/trim.decorator";
import { SWAGGER_PROPERTIES } from "../../../shared/constants/swagger-properties.constants";
import { VALIDATION_MESSAGES } from "../../../shared/constants/validation-messages";

export class CreateRoleDto {
    @ApiProperty({
        ...SWAGGER_PROPERTIES.ROLE_NAME,
        minLength: 2,
        maxLength: 50
    })
    @Trim()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Tên role') })
    @MinLength(2, { message: VALIDATION_MESSAGES.FIELD_MIN('Tên role', 2) })
    @MaxLength(50, { message: VALIDATION_MESSAGES.FIELD_MAX('Tên role', 50) })
    roleName: string;

    @ApiPropertyOptional(SWAGGER_PROPERTIES.ROLE_DESCRIPTION)
    @Trim()
    @IsOptional()
    @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả role') })
    @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Mô tả', 255) })
    description?: string;

    @ApiPropertyOptional({
        description: 'Role có thể được cấp hay không',
        example: true,
        default: true
    })
    @IsOptional()
    @IsBoolean()
    isAssignable?: boolean;

    @ApiPropertyOptional({
        description: 'ID của role cần có để cấp role này',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Role ID phải lớn hơn 0' })
    requiredByRoleId?: number;
}

export class UpdateRoleDto {
    @ApiPropertyOptional({
        description: 'Tên role',
        example: 'TEACHER'
    })
    @Trim()
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    roleName?: string;

    @ApiPropertyOptional({
        description: 'Mô tả role',
        example: 'Role dành cho giảng viên'
    })
    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;

    @ApiPropertyOptional({
        description: 'Role có thể được cấp hay không',
        example: true
    })
    @IsOptional()
    @IsBoolean()
    isAssignable?: boolean;

    @ApiPropertyOptional({
        description: 'ID của role cần có để cấp role này',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Role ID phải lớn hơn 0' })
    requiredByRoleId?: number;
}

export class RoleResponseDto {
    @ApiProperty({
        description: 'ID của role',
        example: 1
    })
    roleId: number;

    @ApiProperty({
        description: 'Tên role',
        example: 'TEACHER'
    })
    roleName: string;

    @ApiPropertyOptional({
        description: 'Mô tả role',
        example: 'Role dành cho giảng viên'
    })
    description?: string;

    @ApiProperty({
        description: 'Role có thể được cấp hay không',
        example: true
    })
    isAssignable: boolean;

    @ApiPropertyOptional({
        description: 'ID của role cần có để cấp role này',
        example: 1
    })
    requiredByRoleId?: number;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2025-09-04T05:36:25.000Z'
    })
    createdAt: Date;

    @ApiPropertyOptional({
        description: 'Thông tin role cha (nếu có)',
        type: () => RoleResponseDto
    })
    requiredByRole?: RoleResponseDto;

    @ApiPropertyOptional({
        description: 'Danh sách role con',
        type: [RoleResponseDto]
    })
    childRoles?: RoleResponseDto[];
}