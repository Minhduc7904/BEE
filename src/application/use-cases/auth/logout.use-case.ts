// src/application/use-cases/logout.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { JwtTokenService } from '../../../infrastructure/services/jwt.service'
import { TokenHashService } from '../../../infrastructure/services/token-hash.service'
import { LogoutRequestDto, LogoutResponseDto } from '../../dtos/auth/logout.dto'
import { UnauthorizedException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

/**
 * Use case cho logout - revoke refresh token và invalidate token family
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
    @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
  ) {}

  async execute(logoutDto: LogoutRequestDto): Promise<BaseResponseDto<LogoutResponseDto>> {
    return await this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Verify refresh token format và decode
      let decodedToken
      try {
        decodedToken = this.jwtTokenService.verifyRefreshToken(logoutDto.refreshToken)
      } catch (error) {
        throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn')
      }

      // 2. Tìm tất cả active refresh tokens của user
      const userId = decodedToken.sub
      const allUserTokens = await repos.userRefreshTokenRepository.findByUserId(userId)

      // Lọc chỉ lấy tokens còn active
      const activeTokens = allUserTokens.filter((token) => token.isActive())

      // 3. Tìm token match bằng cách verify hash
      let matchedToken: any = null
      for (const token of activeTokens) {
        if (await this.tokenHashService.verifyToken(logoutDto.refreshToken, token.tokenHash)) {
          matchedToken = token
          break
        }
      }

      if (!matchedToken) {
        throw new UnauthorizedException('Refresh token không tồn tại hoặc đã bị revoke')
      }

      // 4. Kiểm tra token có còn active không
      if (!matchedToken.isActive()) {
        throw new UnauthorizedException('Token đã hết hạn hoặc không còn hiệu lực')
      }

      // 5. Verify user vẫn tồn tại
      const user = await repos.userRepository.findById(matchedToken.userId)
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại')
      }

      // 6. Revoke token hiện tại
      await repos.userRefreshTokenRepository.revokeToken(matchedToken.tokenHash)

      // 7. Option: Revoke all tokens in same family (logout from all devices with same session)
      // Uncomment dòng dưới nếu muốn logout khỏi tất cả devices cùng family
      // await repos.userRefreshTokenRepository.revokeTokenFamily(matchedToken.familyId);

      // 8. Option: Revoke all tokens của user (logout from all devices)
      // Uncomment dòng dưới nếu muốn logout khỏi tất cả devices
      // await repos.userRefreshTokenRepository.revokeAllUserTokens(userId);

      // 9. Update last used cho token
      await repos.userRefreshTokenRepository.updateLastUsed(matchedToken.tokenHash)

      // 10. Tạo response
      const logoutResponse: LogoutResponseDto = {
        message: 'Đăng xuất thành công',
      }

      return BaseResponseDto.success('Đăng xuất thành công', logoutResponse)
    })
  }

  /**
   * Logout khỏi tất cả devices (revoke all user tokens)
   */
  async executeLogoutAllDevices(logoutDto: LogoutRequestDto): Promise<BaseResponseDto<LogoutResponseDto>> {
    return await this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Verify refresh token để lấy userId
      let decodedToken
      try {
        decodedToken = this.jwtTokenService.verifyRefreshToken(logoutDto.refreshToken)
      } catch (error) {
        throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn')
      }

      const userId = decodedToken.sub

      // 2. Verify user tồn tại
      const user = await repos.userRepository.findById(userId)
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại')
      }

      // 3. Revoke tất cả tokens của user
      await repos.userRefreshTokenRepository.revokeAllUserTokens(userId)

      // 4. Tạo response
      const logoutResponse: LogoutResponseDto = {
        message: 'Đăng xuất khỏi tất cả thiết bị thành công',
      }

      return BaseResponseDto.success('Đăng xuất khỏi tất cả thiết bị thành công', logoutResponse)
    })
  }
}
