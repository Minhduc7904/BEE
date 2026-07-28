import { IsNullableInt, IsOptionalString } from '../../../shared/decorators/validate'

export class UpdateAssistantTaskProductDto {
  @IsOptionalString('Tên sản phẩm', 255)
  name?: string | null

  @IsNullableInt('Số lượng', 0)
  quantity?: number | null
}
