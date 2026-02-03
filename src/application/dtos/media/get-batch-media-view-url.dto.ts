import { IsArray, ArrayMinSize, ArrayMaxSize, IsNumber } from 'class-validator'

/**
 * DTO for getting batch media view URLs
 * 
 * @description Used to retrieve view URLs for multiple media files at once (max 100)
 */
export class GetBatchMediaViewUrlDto {
  /**
   * Array of media IDs (1-100 items)
   * @required
   * @example [1, 2, 3, 4, 5]
   */
  @IsArray({ message: 'Danh sách ID phải là mảng' })
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 ID' })
  @ArrayMaxSize(100, { message: 'Tối đa 100 ID' })
  @IsNumber({}, { each: true, message: 'Mỗi ID phải là số' })
  mediaIds: number[]
}
