import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { SWAGGER_PROPERTIES, VALIDATION_MESSAGES } from '../../../shared/constants'
import { StorageProvider } from '../../../shared/enums'
import { FileResponseDto } from '..'
import { QuestionImage } from '../../../domain/entities'

export class CreateQuestionImageDto {
  @ApiProperty(SWAGGER_PROPERTIES.URL)
  @Trim()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  url: string

  @ApiProperty(SWAGGER_PROPERTIES.ANOTHER_URL)
  @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  anotherUrl?: string

  @ApiProperty(SWAGGER_PROPERTIES.MIME_TYPE)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  mimeType?: string

  @ApiProperty(SWAGGER_PROPERTIES.STORAGE_PROVIDER)
  @Trim()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider: StorageProvider

  @ApiProperty(SWAGGER_PROPERTIES.RELATED_TYPE)
  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Loại liên kết') })
  relatedType?: string

  @ApiProperty(SWAGGER_PROPERTIES.RELATED_ID)
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID liên kết') })
  relatedId?: number
}

export class QuestionImageResponseDto extends FileResponseDto {
  @ApiProperty(SWAGGER_PROPERTIES.IMAGE_ID)
  imageId: number

  @ApiPropertyOptional(SWAGGER_PROPERTIES.CAPTION)
  caption?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_TYPE)
  relatedType?: string

  @ApiPropertyOptional(SWAGGER_PROPERTIES.RELATED_ID)
  relatedId?: number

  constructor(partial: Partial<QuestionImageResponseDto>) {
    super()
    Object.assign(this, partial)
  }

  static fromEntity(image: QuestionImage): QuestionImageResponseDto {
    return new QuestionImageResponseDto({
      imageId: image.imageId,
      adminId: image.adminId,
      url: image.url,
      anotherUrl: image.anotherUrl,
      caption: image.caption,
      mimeType: image.mimeType,
      storageProvider: image.storageProvider,
      relatedType: image.relatedType,
      relatedId: image.relatedId,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    })
  }
}