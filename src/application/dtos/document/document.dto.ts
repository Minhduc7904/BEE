import { IsString, IsOptional, IsNumber, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageProvider } from '../../../constants/storage-provider.constant';

export class CreateDocumentDto {
    @ApiProperty({
        description: 'URL để tải document từ internet',
        example: 'https://example.com/document.pdf'
    })
    @IsUrl({}, { message: 'URL không hợp lệ' })
    @IsString()
    sourceUrl: string;

    @ApiPropertyOptional({
        description: 'Mô tả document',
        example: 'Tài liệu toán học lớp 10'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Môn học',
        example: 'Toán'
    })
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiPropertyOptional({
        description: 'Loại liên kết',
        example: 'question'
    })
    @IsOptional()
    @IsString()
    relatedType?: string;

    @ApiPropertyOptional({
        description: 'ID liên kết',
        example: 123
    })
    @IsOptional()
    @IsNumber()
    relatedId?: number;

    @ApiPropertyOptional({
        description: 'ID admin tạo document',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    adminId?: number;
}

export class DocumentResponseDto {
    @ApiProperty()
    documentId: number;

    @ApiProperty()
    url: string;

    @ApiPropertyOptional()
    anotherUrl?: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiPropertyOptional()
    subject?: string;

    @ApiPropertyOptional()
    mimeType?: string;

    @ApiProperty({ enum: StorageProvider })
    storageProvider: StorageProvider;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}