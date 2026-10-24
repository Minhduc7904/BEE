import { Inject, Injectable } from '@nestjs/common'

import type { IUserRepository } from '../../../domain/repositories'
import type { AuthenticatedUser } from '../../interfaces'
import { PasswordService } from '../../interfaces'
import { BaseResponseDto } from '../../dtos'
import { ChangePasswordDto } from '../../dtos/profile/change-password.dto'
import {
  ForbiddenException,
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class ChangeParentPasswordUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
  ) {}

  async execute(identity: AuthenticatedUser, dto: ChangePasswordDto): Promise<BaseResponseDto<null>> {
    if (identity.userType !== 'parent') {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể đổi mật khẩu tại đây')
    }

    const user = await this.userRepository.findById(identity.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    // Trả 400 (không phải 401) để client không nhầm với phiên hết hạn và không kích hoạt refresh/đăng xuất.
    if (!(await this.passwordService.comparePassword(dto.oldPassword, user.passwordHash))) {
      throw new ValidationException('Mật khẩu cũ không chính xác')
    }
    if (await this.passwordService.comparePassword(dto.newPassword, user.passwordHash)) {
      throw new ValidationException('Mật khẩu mới không được trùng với mật khẩu cũ')
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword)
    await this.userRepository.update(identity.userId, { passwordHash })

    return BaseResponseDto.success('Đổi mật khẩu thành công', null)
  }
}
