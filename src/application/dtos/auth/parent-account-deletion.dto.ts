import { IsRequiredLocalPhoneVN, IsRequiredString } from '../../../shared/decorators/validate'

export class DeleteParentAccountDto {
  @IsRequiredString('Mật khẩu', 100, 6)
  password: string
}

export class DeleteParentAccountPublicDto extends DeleteParentAccountDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string
}

export class AllowParentRegistrationDto {
  @IsRequiredLocalPhoneVN('Số điện thoại phụ huynh')
  phone: string
}

export interface DeleteParentAccountResponseDto {
  status: 'DELETED'
  deletedAt: Date
}
