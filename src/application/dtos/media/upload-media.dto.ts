import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaType } from '@prisma/client'

export class UploadMediaDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  folderId?: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  alt?: string

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  width?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  height?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  duration?: number
}
