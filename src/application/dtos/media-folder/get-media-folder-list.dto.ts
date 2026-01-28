import { IsOptional, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { ToNumber } from 'src/shared/decorators'

/**
 * GetMediaFolderListDto - Request DTO for listing media folders
 */
export class GetMediaFolderListDto {
  @IsOptional()
  @IsInt()
  @ToNumber()
  parentId?: number

  @IsOptional()
  @IsInt()
  @ToNumber()
  createdBy?: number

  @IsOptional()
  @IsInt()
  @ToNumber()
  skip?: number

  @IsOptional()
  @IsInt()
  @ToNumber()
  take?: number
}
