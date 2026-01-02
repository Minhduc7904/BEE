import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * CreateMediaFolderDto - Request DTO for creating media folder
 */
export class CreateMediaFolderDto {
  @IsString()
  @MaxLength(255)
  name: string

  @IsString()
  @MaxLength(255)
  slug: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number
}
