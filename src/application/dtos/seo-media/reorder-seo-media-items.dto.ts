import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator'
import { IsRequiredIdNumber, IsRequiredInt } from 'src/shared/decorators/validate'

export class ReorderSeoMediaItemDto {
  @IsRequiredIdNumber('ID item')
  itemId: number

  @IsRequiredInt('Thứ tự hiển thị', 0)
  sortOrder: number
}

export class ReorderSeoMediaItemsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderSeoMediaItemDto)
  items: ReorderSeoMediaItemDto[]
}
