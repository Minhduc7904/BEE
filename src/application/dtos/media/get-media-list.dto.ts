import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { MediaType, MediaStatus } from '@prisma/client'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ListQueryDto } from '../pagination/list-query.dto'

export class GetMediaListDto extends ListQueryDto {
  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('ID thư mục') })
  @Type(() => Number)
  folderId?: number

  @IsOptional()
  @IsEnum(MediaType, { message: VALIDATION_MESSAGES.FIELD_INVALID('Loại media') })
  type?: MediaType

  @IsOptional()
  @IsEnum(MediaStatus, { message: VALIDATION_MESSAGES.FIELD_INVALID('Trạng thái') })
  status?: MediaStatus

  @IsOptional()
  @IsNumber({}, { message: VALIDATION_MESSAGES.FIELD_INVALID('Người tải lên') })
  @Type(() => Number)
  uploadedBy?: number

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Bucket name') })
  @Trim()
  bucketName?: string

}
