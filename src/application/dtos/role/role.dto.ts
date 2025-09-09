import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength, IsBoolean, IsNumber, Min } from "class-validator";
import { Trim } from "../../../shared/decorators/trim.decorator";
export class CreateRoleDto {
    @ApiProperty({
        description: 'Tên role',
        example: 'TEACHER',
        minLength: 2,
        maxLength: 50
    })
    @Trim()
    @IsString()
    @MinLength(2, { message: 'Tên role phải có ít nhất 2 ký tự' })
    @MaxLength(50, { message: 'Tên role không được quá 50 ký tự' })
    roleName: string;

    @ApiPropertyOptional({
        description: 'Mô tả role',
        example: 'Role dành cho giảng viên'
    })
    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Mô tả không được quá 255 ký tự' })
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