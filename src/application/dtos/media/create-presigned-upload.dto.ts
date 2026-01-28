import { IsString, IsOptional, IsInt, IsEnum, Min, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaType } from '../../../shared/enums'
import { ToNumber } from 'src/shared/decorators'

/**
 * DTO for requesting presigned upload URL
 * Frontend sends file metadata before actual upload
 */
export class CreatePresignedUploadDto {
  @IsString()
  originalFilename: string

  @IsString()
  mimeType: string

  @IsNumber()
  @Min(1)
  fileSize: number

  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType

  @IsInt()
  @IsOptional()
  @ToNumber()
  folderId?: number

  @IsInt()
  @IsOptional()
  @ToNumber()
  width?: number

  @IsInt()
  @IsOptional()
  @ToNumber()
  height?: number

  @IsInt()
  @IsOptional()
  @ToNumber()
  duration?: number
}
