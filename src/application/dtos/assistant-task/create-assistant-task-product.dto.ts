import { IsNullableInt, IsOptionalString, IsRequiredIdNumber } from '../../../shared/decorators/validate'

export class CreateAssistantTaskProductDto {
  @IsRequiredIdNumber('ID đề thi')
  examId!: number

  @IsOptionalString('Tên sản phẩm', 255)
  name?: string | null

  @IsNullableInt('Số lượng', 0)
  quantity?: number | null
}
