import { IsString, IsOptional, IsUrl, IsNumber } from 'class-validator'
import { StorageProvider } from '../../../shared/enums/storage-provider.enum'
import { IsEnumValue } from '../../../shared/decorators/is-enum-value.decorator'
import { Trim } from '../../../shared/decorators/trim.decorator'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { FileResponseDto } from '..'
import { MediaImage } from 'src/domain/entities'

export class CreateMediaImageDto {
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

    @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID admin') })
  adminId: number
}

export class MediaImageResponseDto extends FileResponseDto {
    imageId: number

    caption?: string

  constructor(partial: Partial<MediaImageResponseDto>) {
    super()
    Object.assign(this, partial)
  }

  static fromEntity(mediaImage: MediaImage): MediaImageResponseDto {
    return new MediaImageResponseDto({
      imageId: mediaImage.imageId,
      adminId: mediaImage.adminId,
      url: mediaImage.url,
      anotherUrl: mediaImage.anotherUrl,
      caption: mediaImage.caption,
      mimeType: mediaImage.mimeType,
      storageProvider: mediaImage.storageProvider,
      createdAt: mediaImage.createdAt,
      updatedAt: mediaImage.updatedAt,
    })
  }
}
