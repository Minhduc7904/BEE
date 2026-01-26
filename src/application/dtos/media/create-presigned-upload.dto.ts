import { IsString, IsOptional, IsInt, IsEnum, Min, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaType } from '../../../shared/enums'

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
  @Type(() => Number)
  folderId?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  width?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  height?: number

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  duration?: number
}
