import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ToNumber } from 'src/shared/decorators'

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
  @ToNumber()
  parentId?: number
}
