import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * UpdateMediaFolderDto - Request DTO for updating media folder
 */
export class UpdateMediaFolderDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number
}
