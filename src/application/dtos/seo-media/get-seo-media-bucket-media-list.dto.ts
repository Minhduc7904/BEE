import { IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'
import { MediaType } from 'src/shared/enums'
import { ListQueryDto } from '../pagination/list-query.dto'

export class GetSeoMediaBucketMediaListDto extends ListQueryDto {
  /**
   * Filter media type in seoMedia bucket.
   *
   * @example MediaType.VIDEO
   */
  @IsOptionalEnumValue(MediaType, 'Media type')
  mediaType?: MediaType

  /**
   * MinIO object prefix to list from seoMedia bucket.
   *
   * @example 'videos/'
   */
  @IsOptionalString('Tien to object', 255)
  prefix?: string
}
