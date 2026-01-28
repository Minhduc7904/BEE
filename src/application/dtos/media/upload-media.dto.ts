import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaType } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class UploadMediaDto {
  @IsOptional()
  @IsNumber()
  @ToNumber()
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
  @ToNumber()
  width?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ToNumber()
  height?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ToNumber()
  duration?: number
}
