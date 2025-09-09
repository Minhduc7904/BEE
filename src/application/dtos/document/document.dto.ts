import { IsString, IsOptional, IsNumber, IsUrl, IsMimeType } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageProvider } from '../../../shared/enums/storage-provider.enum';
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { ListQueryDto } from '../pagination/list-query.dto';

export class CreateDocumentDto {
    @ApiProperty({
        description: 'URL chính của document',
        example: 'https://example.com/document.pdf'
    })
    @Trim()
    @IsUrl({}, { message: 'URL không hợp lệ' })
    @IsString()
    url: string;

    @ApiPropertyOptional({
        description: 'URL phụ của document (tùy chọn)',
        example: 'https://example.com/document-backup.pdf'
    })
    @Trim()
    @IsOptional()
    @IsUrl({}, { message: 'Another URL không hợp lệ' })
    @IsString()
    anotherUrl?: string;

    @ApiPropertyOptional({
        description: 'Mô tả document',
        example: 'Tài liệu toán học lớp 10 - Chương 1: Hàm số'
    })
    @Trim()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'MIME type của document',
        example: 'application/pdf'
    })
    @Trim()
    @IsOptional()
    @IsMimeType()
    @IsString()
    mimeType?: string;

    @ApiPropertyOptional({
        description: 'Môn học liên quan',
        example: 'Toán học'
    })
    @Trim()
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiPropertyOptional({
        description: 'Loại đối tượng liên kết (question, exam, lesson, etc.)',
        example: 'question'
    })
    @Trim()
    @IsOptional()
    @IsString()
    relatedType?: string;

    @ApiPropertyOptional({
        description: 'ID của đối tượng liên kết',
        example: 123
    })
    @IsOptional()
    @IsNumber()
    relatedId?: number;

    @ApiProperty({
        description: 'Nhà cung cấp lưu trữ',
        enum: StorageProvider,
        example: StorageProvider.EXTERNAL
    })
    @IsEnumValue(StorageProvider)
    storageProvider: StorageProvider;

    @ApiPropertyOptional({
        description: 'ID admin tạo document',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    adminId?: number;
}

export class UpdateDocumentDto {
    @ApiPropertyOptional({
        description: 'URL chính của document',
        example: 'https://example.com/document-updated.pdf'
    })
    @Trim()
    @IsOptional()
    @IsUrl({}, { message: 'URL không hợp lệ' })
    @IsString()
    url?: string;

    @ApiPropertyOptional({
        description: 'URL phụ của document',
        example: 'https://example.com/document-backup-updated.pdf'
    })
    @Trim()
    @IsOptional()
    @IsUrl({}, { message: 'Another URL không hợp lệ' })
    @IsString()
    anotherUrl?: string;

    @ApiPropertyOptional({
        description: 'Mô tả document',
        example: 'Tài liệu toán học lớp 10 - Chương 1: Hàm số (cập nhật)'
    })
    @Trim()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'MIME type của document',
        example: 'application/pdf'
    })
    @Trim()
    @IsOptional()
    @IsMimeType()
    @IsString()
    mimeType?: string;

    @ApiPropertyOptional({
        description: 'Môn học liên quan',
        example: 'Toán học'
    })
    @Trim()
    @IsOptional()
    @IsString()
    subject?: string;

    @ApiPropertyOptional({
        description: 'Loại đối tượng liên kết',
        example: 'question'
    })
    @Trim()
    @IsOptional()
    @IsString()
    relatedType?: string;

    @ApiPropertyOptional({
        description: 'ID của đối tượng liên kết',
        example: 123
    })
    @IsOptional()
    @IsNumber()
    relatedId?: number;

    @ApiPropertyOptional({
        description: 'Nhà cung cấp lưu trữ',
        enum: StorageProvider
    })
    @Trim()
    @IsOptional()
    @IsEnumValue(StorageProvider)
    storageProvider?: StorageProvider;
}

export class DocumentResponseDto {
    @ApiProperty({
        description: 'ID của document',
        example: 1
    })
    documentId: number;

    @ApiPropertyOptional({
        description: 'ID admin tạo document',
        example: 1
    })
    adminId?: number;

    @ApiProperty({
        description: 'URL chính của document',
        example: 'https://example.com/document.pdf'
    })
    url: string;

    @ApiPropertyOptional({
        description: 'URL phụ của document',
        example: 'https://example.com/document-backup.pdf'
    })
    anotherUrl?: string;

    @ApiPropertyOptional({
        description: 'Mô tả document',
        example: 'Tài liệu toán học lớp 10'
    })
    description?: string;

    @ApiPropertyOptional({
        description: 'MIME type của document',
        example: 'application/pdf'
    })
    mimeType?: string;

    @ApiPropertyOptional({
        description: 'Môn học liên quan',
        example: 'Toán học'
    })
    subject?: string;

    @ApiPropertyOptional({
        description: 'Loại đối tượng liên kết',
        example: 'question'
    })
    relatedType?: string;

    @ApiPropertyOptional({
        description: 'ID của đối tượng liên kết',
        example: 123
    })
    relatedId?: number;

    @ApiProperty({
        description: 'Nhà cung cấp lưu trữ',
        enum: StorageProvider,
        example: StorageProvider.EXTERNAL
    })
    storageProvider: StorageProvider;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2024-08-28T10:30:00Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Thời gian cập nhật',
        example: '2024-08-28T10:30:00Z'
    })
    updatedAt: Date;
}

export class DocumentQueryDto extends ListQueryDto {
    @ApiPropertyOptional({
        description: 'Môn học để filter',
        example: 'Toán học'
    })
    @IsOptional()
    @IsString()
    @Trim()
    subject?: string;

    @ApiPropertyOptional({
        description: 'Loại đối tượng liên kết để filter',
        example: 'question'
    })
    @IsOptional()
    @IsString()
    @Trim()
    relatedType?: string;

    @ApiPropertyOptional({
        description: 'ID của đối tượng liên kết để filter',
        example: 123
    })
    @IsOptional()
    @IsNumber()
    relatedId?: number;

    @ApiPropertyOptional({
        description: 'Nhà cung cấp lưu trữ để filter',
        enum: StorageProvider
    })
    @IsOptional()
    @IsEnumValue(StorageProvider)
    storageProvider?: StorageProvider;

    @ApiPropertyOptional({
        description: 'ID admin để filter',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    adminId?: number;
}