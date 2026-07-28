import { IsOptionalString, IsRequiredIdNumber } from '../../../shared/decorators/validate'

export class CreateMyAssistantTaskProductDto {
  @IsRequiredIdNumber('ID đề thi')
  examId!: number

  @IsOptionalString('Tên sản phẩm', 255)
  name?: string | null
}
