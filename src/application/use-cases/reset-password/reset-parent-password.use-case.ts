import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { IUnitOfWork } from '../../../domain/repositories'
import { PasswordService, TokenService } from '../../interfaces'
import { BaseResponseDto, ResetParentPasswordDto, ResetParentPasswordResultDto } from '../../dtos'
import {
  BusinessLogicException,
  NotFoundException,
  ValidationException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class ResetParentPasswordUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly tokenService: TokenService,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: ResetParentPasswordDto): Promise<BaseResponseDto<ResetParentPasswordResultDto>> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ValidationException('Mật khẩu xác nhận không khớp')
    }

    const tokenHash = this.tokenService.hashToken(dto.token)
    const passwordHash = await this.passwordService.hashPassword(dto.newPassword)

    await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const token = await repos.passwordResetTokenRepository.findByTokenHash(tokenHash)
        if (!token) throw new NotFoundException('Token không tồn tại hoặc đã được sử dụng')
        if (!token.canBeUsed()) throw new BusinessLogicException('Token đã hết hạn hoặc đã được sử dụng')

        const parent = await repos.parentRepository.findByUserId(token.userId, { includeUser: true })
        if (!parent || !parent.user?.isActive) {
          throw new NotFoundException('Token không thuộc tài khoản phụ huynh hợp lệ')
        }

        const consumed = await repos.passwordResetTokenRepository.markAsUsedIfUsable(token.id, new Date())
        if (!consumed) throw new BusinessLogicException('Token đã hết hạn hoặc đã được sử dụng')

        await repos.userRepository.update(parent.userId, { passwordHash })
        await repos.userRefreshTokenRepository.revokeAllUserTokens(parent.userId)
        // Mọi phiên đăng nhập đã bị thu hồi nên không còn thiết bị nào được nhận thông báo.
        await repos.userDeviceRepository.deleteByUserId(parent.userId)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Đặt lại mật khẩu phụ huynh thành công', { changed: true })
  }
}
