import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { AuditStatus } from "../../../shared/enums/audit-status.enum";
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class CreateLogDto {
    @ApiProperty({
        description: 'Key của hành động',
        example: 'CREATE_USER'
    })
    @Trim()
    @IsString()
    actionKey: string;

    @ApiProperty({
        description: 'Trạng thái của hành động',
        enum: AuditStatus,
        example: AuditStatus.SUCCESS
    })
    @Trim()
    @IsEnumValue(AuditStatus)
    status: AuditStatus;

    @ApiPropertyOptional({
        description: 'Lỗi nếu có',
        example: 'User already exists'
    })
    @Trim()
    @IsOptional()
    @IsString()
    errorMessage?: string;

    @ApiProperty({
        description: 'Loại tài nguyên',
        example: 'user'
    })
    @Trim()
    @IsString()
    resourceType: string;

    @ApiPropertyOptional({
        description: 'ID của tài nguyên',
        example: '1'
    })
    @Trim()
    @IsOptional()
    @IsString()
    resourceId?: string;

    @ApiPropertyOptional({
        description: 'Dữ liệu trước khi thay đổi',
        example: { name: 'John Doe' }
    })
    @Trim()
    @IsOptional()
    beforeData?: any;

    @ApiPropertyOptional({
        description: 'Dữ liệu sau khi thay đổi',
        example: { name: 'John Smith' }
    })
    @Trim()
    @IsOptional()
    afterData?: any;

    @ApiProperty({
        description: 'ID của admin thực hiện hành động',
        example: 1
    })
    @IsNumber()
    adminId: number;
}

export class LogResponseDto {
    @ApiProperty({
        description: 'ID của log',
        example: 1
    })
    logId: number;

    @ApiProperty({
        description: 'Key của hành động',
        example: 'CREATE_USER'
    })
    actionKey: string;

    @ApiProperty({
        description: 'Trạng thái của hành động',
        enum: AuditStatus,
        example: AuditStatus.SUCCESS
    })
    status: AuditStatus;

    @ApiPropertyOptional({
        description: 'Lỗi nếu có',
        example: 'User already exists'
    })
    errorMessage?: string;

    @ApiProperty({
        description: 'Loại tài nguyên',
        example: 'user'
    })
    resourceType: string;

    @ApiPropertyOptional({
        description: 'ID của tài nguyên',
        example: '1'
    })
    resourceId?: string;

    @ApiPropertyOptional({
        description: 'Dữ liệu trước khi thay đổi',
        example: { name: 'John Doe' }
    })
    beforeData?: any;

    @ApiPropertyOptional({
        description: 'Dữ liệu sau khi thay đổi',
        example: { name: 'John Smith' }
    })
    afterData?: any;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2025-09-04T05:36:25.000Z'
    })
    createdAt: Date;
}