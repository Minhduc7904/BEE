import { IsString, IsOptional, IsNumber, IsUrl, IsMimeType } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { StorageProvider } from '../../../shared/enums/storage-provider.enum'
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator'
import { Trim } from '../../../shared/decorators/trim.decorator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { SWAGGER_PROPERTIES } from '../../../shared/constants/swagger-properties.constants'
import { VALIDATION_MESSAGES } from '../../../shared/constants/validation-messages'

export class CreateDocumentDto {
  @ApiProperty(SWAGGER_PROPERTIES.URL)
  @Trim()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  url: string

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

  @ApiProperty({
    description: 'Nhà cung cấp lưu trữ',
    enum: StorageProvider,
    example: StorageProvider.EXTERNAL,
  })
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider: StorageProvider

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ADMIN_ID)
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
  adminId?: number
}

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

export class DocumentResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.DOCUMENT_ID)
  documentId: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ADMIN_ID)
  adminId?: number

  @ApiProperty(SWAGGER_PROPERTIES.URL)
  url: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.ANOTHER_URL)
  anotherUrl?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.DESCRIPTION)
  description?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.MIME_TYPE)
  mimeType?: string

  @ApiPropertyOptional()
  subjectId?: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.SUBJECT)
  subject?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_TYPE)
  relatedType?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_ID)
  relatedId?: number

  @ApiProperty(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
  storageProvider: StorageProvider

  @ApiProperty(SWAGGER_PROPERTIES.CREATED_AT)
  createdAt: Date

  @ApiProperty(SWAGGER_PROPERTIES.UPDATED_AT)
  updatedAt: Date
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
