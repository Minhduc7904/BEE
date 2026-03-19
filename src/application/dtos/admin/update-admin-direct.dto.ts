import { IsOptionalBoolean, IsRequiredIdNumber } from 'src/shared/decorators/validate'
import { UpdateAdminDto } from './admin.dto'

/**
 * DTO cho super-admin cập nhật trực tiếp thông tin admin + user của admin
 */
export class UpdateAdminDirectDto extends UpdateAdminDto {
  /**
   * ID admin cần cập nhật
   * @required
   * @example 10
   */
  @IsRequiredIdNumber('ID admin')
  adminId: number

  /**
   * Trạng thái hoạt động tài khoản user của admin
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Trạng thái hoạt động')
  isActive?: boolean
}
