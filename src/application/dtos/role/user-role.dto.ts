import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber, Min, IsDateString, IsBoolean } from "class-validator";
import { RoleResponseDto } from "./role.dto";

export class AssignUserRoleDto {
    @ApiProperty({
        description: 'ID của user cần cấp role',
        example: 1
    })
    @IsNumber()
    @Min(1, { message: 'User ID phải lớn hơn 0' })
    userId: number;

    @ApiProperty({
        description: 'ID của role cần cấp',
        example: 2
    })
    @IsNumber()
    @Min(1, { message: 'Role ID phải lớn hơn 0' })
    roleId: number;

    @ApiPropertyOptional({
        description: 'Thời gian hết hạn role (ISO string)',
        example: '2025-09-04T05:36:25.000Z'
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class UpdateUserRoleDto {
    @ApiPropertyOptional({
        description: 'Thời gian hết hạn role (ISO string)',
        example: '2025-09-04T05:36:25.000Z'
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiPropertyOptional({
        description: 'Trạng thái active của role',
        example: true
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UserRoleResponseDto {
    @ApiProperty({
        description: 'ID của user',
        example: 1
    })
    userId: number;

    @ApiProperty({
        description: 'ID của role',
        example: 2
    })
    roleId: number;

    @ApiProperty({
        description: 'Thời gian được cấp role',
        example: '2025-09-04T05:36:25.000Z'
    })
    assignedAt: Date;

    @ApiPropertyOptional({
        description: 'Thời gian hết hạn role',
        example: '2025-09-04T05:36:25.000Z'
    })
    expiresAt?: Date;

    @ApiPropertyOptional({
        description: 'ID của user đã cấp role này',
        example: 3
    })
    assignedBy?: number;

    @ApiProperty({
        description: 'Trạng thái active của role',
        example: true
    })
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

    @ApiProperty({
        description: 'Tổng số records',
        example: 10
    })
    total: number;

    @ApiProperty({
        description: 'Số trang hiện tại',
        example: 1
    })
    page: number;

    @ApiProperty({
        description: 'Số items per page',
        example: 10
    })
    limit: number;
}
