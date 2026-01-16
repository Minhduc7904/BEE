import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaStatus } from 'src/shared/enums'

export class UpdateMediaDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  folderId?: number

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  alt?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  width?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  height?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number
}
