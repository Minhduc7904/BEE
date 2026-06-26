import {
  IsOptionalInt,
  IsOptionalNumber,
  IsOptionalString,
  IsOptionalIdNumber,
  IsOptionalEnumValue,
} from 'src/shared/decorators/validate'
import { MediaType } from 'src/shared/enums'

export class UpdateSeoMediaItemDto {
  @IsOptionalIdNumber('ID slot')
  slotId?: number

  @IsOptionalString('Bucket name', 100)
  bucketName?: string

  @IsOptionalString('Object key', 500)
  objectKey?: string

  @IsOptionalString('Public URL', 1000)
  publicUrl?: string

  @IsOptionalString('Original file name', 255)
  originalName?: string

  @IsOptionalString('MIME type', 100)
  mimeType?: string

  @IsOptionalEnumValue(MediaType, 'Media type')
  mediaType?: MediaType

  @IsOptionalNumber('File size', 1)
  fileSize?: number

  @IsOptionalInt('Width', 1)
  width?: number

  @IsOptionalInt('Height', 1)
  height?: number

  @IsOptionalNumber('Duration', 0)
  duration?: number

  @IsOptionalInt('Thứ tự hiển thị', 0)
  sortOrder?: number

  @IsOptionalString('Alt text', 255)
  alt?: string

  @IsOptionalString('Link URL', 1000)
  linkUrl?: string
}
