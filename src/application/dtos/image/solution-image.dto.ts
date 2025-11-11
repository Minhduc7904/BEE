import { IsOptional, IsString, IsUrl, IsNumber } from 'class-validator'
import { Trim, IsEnumValue } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { StorageProvider } from '../../../shared/enums'
import { FileResponseDto } from '..'
import { SolutionImage } from '../../../domain/entities'

export class CreateSolutionImageDto {
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

export class SolutionImageResponseDto extends FileResponseDto {
    imageId: number

    caption?: string

  constructor(partial: Partial<SolutionImageResponseDto>) {
    super()
    Object.assign(this, partial)
  }

  static fromEntity(image: SolutionImage): SolutionImageResponseDto {
    return new SolutionImageResponseDto({
      imageId: image.imageId,
      adminId: image.adminId,
      url: image.url,
      anotherUrl: image.anotherUrl,
      caption: image.caption,
      mimeType: image.mimeType,
      storageProvider: image.storageProvider,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    })
  }
}