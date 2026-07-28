import { IsRequiredString } from '../../../shared/decorators/validate'

export class UpdateMyAssistantTaskProductDto {
  @IsRequiredString('Tên sản phẩm', 255)
  name!: string
}
