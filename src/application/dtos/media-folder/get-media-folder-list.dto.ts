import { IsOptional, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * GetMediaFolderListDto - Request DTO for listing media folders
 */
export class GetMediaFolderListDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  createdBy?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  skip?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  take?: number
}
