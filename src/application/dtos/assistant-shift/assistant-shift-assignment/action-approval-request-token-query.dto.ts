import { IsRequiredString } from '../../../../shared/decorators/validate'

export class ActionApprovalRequestTokenQueryDto {
  @IsRequiredString('Token đề nghị', 128, 64)
  token!: string
}
