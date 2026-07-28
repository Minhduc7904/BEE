import { IsRequiredIdNumber } from '../../../shared/decorators/validate'

export class SubmitAssistantTaskProductDto {
  @IsRequiredIdNumber('ID công việc')
  assistantTaskId!: number

  @IsRequiredIdNumber('ID sản phẩm')
  assistantTaskProductId!: number
}
