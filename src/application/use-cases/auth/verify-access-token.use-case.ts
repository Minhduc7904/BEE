// src/application/use-cases/auth/verify-access-token.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { AuthService, AuthenticatedUser } from '../../../infrastructure/services/auth.service'

/**
 * VerifyAccessTokenUseCase
 * 
 * Use Case cho việc xác thực JWT access token và lấy thông tin user
 * Sử dụng trong AuthGuard để verify token từ request header
 * 
 * @layer Application
 * @dependencies AuthService (Infrastructure)
 */
@Injectable()
export class VerifyAccessTokenUseCase {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authService: AuthService,
  ) { }

  /**
   * Verify JWT access token và trả về thông tin user đầy đủ
   * 
   * @param token - JWT access token từ Authorization header
   * @returns Thông tin user với roles và permissions
   * @throws UnauthorizedException nếu token không hợp lệ hoặc hết hạn
   */
  async execute(token: string): Promise<AuthenticatedUser> {
    return this.authService.verifyTokenAndGetUser(token)
  }
}
