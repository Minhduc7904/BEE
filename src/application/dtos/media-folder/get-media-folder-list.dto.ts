import { IsOptionalIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO for listing media folders
 * 
 * @description Request DTO for querying media folders with filters and pagination
 */
export class GetMediaFolderListDto {
  /**
   * Filter by parent folder ID
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('ID thư mục cha')
  parentId?: number

  /**
   * Filter by creator ID
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('Người tạo')
  createdBy?: number

  /**
   * Number of records to skip
   * @optional
   * @example 0
   */
  @IsOptionalInt('Số bản ghi bỏ qua', 0)
  skip?: number

  /**
   * Number of records to take
   * @optional
   * @example 10
   */
  @IsOptionalInt('Số bản ghi lấy', 1)
  take?: number
}
