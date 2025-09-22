import { IsString, IsOptional, IsNumber, IsUrl, IsMimeType } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { StorageProvider } from '../../../shared/enums'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { ListQueryDto } from '..'
import { SWAGGER_PROPERTIES, VALIDATION_MESSAGES } from '../../../shared/constants'
import { Document } from '../../../domain/entities'
import { FileResponseDto } from '..'

export class UpdateDocumentDto {
  @ApiPropertyOptional(SWAGGER_PROPERTIES.URL)
  @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  url?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ANOTHER_URL)
  @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  anotherUrl?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.DESCRIPTION)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  description?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.MIME_TYPE)
  @Trim()
  @IsOptional()
  @IsMimeType({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  mimeType?: string

  @ApiPropertyOptional({
    description: 'ID của môn học',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Subject ID') })
  subjectId?: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_TYPE)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Loại liên kết') })
  relatedType?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_ID)
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID liên kết') })
  relatedId?: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
  @Trim()
  @IsOptional()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider?: StorageProvider
}

export class DocumentResponseDto extends FileResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.DOCUMENT_ID)
  documentId: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.DESCRIPTION)
  description?: string

  @ApiPropertyOptional()
  subjectId?: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.SUBJECT)
  subject?: any

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_TYPE)
  relatedType?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_ID)
  relatedId?: number

  constructor(partial: Partial<DocumentResponseDto>) {
    super()
    Object.assign(this, partial)
  }

  static fromEntity(document: Document): DocumentResponseDto {
    return new DocumentResponseDto({
      documentId: document.documentId,
      adminId: document.adminId ?? undefined,
      url: document.url,
      anotherUrl: document.anotherUrl ?? undefined,
      description: document.description ?? undefined,
      mimeType: document.mimeType ?? undefined,
      subjectId: document.subjectId ?? undefined,
      subject: document.subject ?? undefined,
      relatedType: document.relatedType ?? undefined,
      relatedId: document.relatedId ?? undefined,
      storageProvider: document.storageProvider,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    })
  }
}

export class DocumentQueryDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: 'ID của môn học để lọc',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Subject ID') })
  subjectId?: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_TYPE)
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Loại liên kết') })
  @Trim()
  relatedType?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_ID)
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID liên kết') })
  relatedId?: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
  @IsOptional()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider?: StorageProvider

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ADMIN_ID)
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
  adminId?: number
}
