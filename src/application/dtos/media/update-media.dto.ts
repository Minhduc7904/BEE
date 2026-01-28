import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class UpdateMediaDto {
  @IsOptional()
  @IsNumber()
  @ToNumber()
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
  @ToNumber()
  width?: number

  @IsOptional()
  @IsNumber()
  @ToNumber()
  height?: number

  @IsOptional()
  @IsNumber()
  @ToNumber()
  duration?: number
}
