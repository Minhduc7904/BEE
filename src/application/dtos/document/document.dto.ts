import { IsString, IsOptional, IsNumber, IsUrl, IsMimeType } from 'class-validator'
import { StorageProvider } from '../../../shared/enums'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { ListQueryDto } from '..'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Document } from '../../../domain/entities'
import { FileResponseDto } from '..'

export class UpdateDocumentDto {
    @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  url?: string

    @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  anotherUrl?: string

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Mô tả') })
  description?: string

    @Trim()
  @IsOptional()
  @IsMimeType({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  mimeType?: string

    @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Subject ID') })
  subjectId?: number

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Loại liên kết') })
  relatedType?: string

    @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID liên kết') })
  relatedId?: number

    @Trim()
  @IsOptional()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider?: StorageProvider
}

export class DocumentResponseDto extends FileResponseDto {
    documentId: number

    description?: string

    subjectId?: number

    subject?: any

    relatedType?: string

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
    @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Subject ID') })
  subjectId?: number

    @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Loại liên kết') })
  @Trim()
  relatedType?: string

    @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID liên kết') })
  relatedId?: number

    @IsOptional()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider?: StorageProvider

    @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
  adminId?: number
}
