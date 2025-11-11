import { IsOptional, IsString, IsInt, IsUrl } from 'class-validator'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { StorageProvider } from '../../../shared/enums'
import { FileResponseDto } from '..'
import { QuestionImage } from '../../../domain/entities'

export class CreateQuestionImageDto {
    @Trim()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL') })
  url: string

    @Trim()
  @IsOptional()
  @IsUrl({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('URL phụ') })
  anotherUrl?: string

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('MIME type') })
  mimeType?: string

    @Trim()
  @IsEnumValue(StorageProvider, { message: VALIDATION_MESSAGES.FIELD_INVALID('Nhà cung cấp lưu trữ') })
  storageProvider: StorageProvider

    @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Loại liên kết') })
  relatedType?: string

    @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.FIELD_INVALID('ID liên kết') })
  relatedId?: number
}

export class QuestionImageResponseDto extends FileResponseDto {
    imageId: number

    caption?: string

    relatedType?: string

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