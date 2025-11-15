import { IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaType, MediaStatus } from '@prisma/client'

export class GetMediaListDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  folderId?: number

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  uploadedBy?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number = 0

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  take?: number = 20
}
