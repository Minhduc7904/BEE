// src/shared/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { VerifyAccessTokenUseCase } from '../../application/use-cases/auth/verify-access-token.use-case'
import type { AuthenticatedUser } from '../../infrastructure/services/auth.service'

// Re-export for backwards compatibility
export type { AuthenticatedUser }

/**
 * AuthGuard
 * 
 * Guard để xác thực JWT access token từ Authorization header.
 * Tuân thủ Clean Architecture: inject UseCase từ Application layer,
 * KHÔNG inject service từ Infrastructure layer.
 * 
 * @layer Shared (Presentation)
 * @dependencies VerifyAccessTokenUseCase (Application)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly verifyAccessTokenUseCase: VerifyAccessTokenUseCase,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new UnauthorizedException('Access token is required')
    }

    try {
      // ✅ Use Application layer UseCase (Clean Architecture compliant)
      const user = await this.verifyAccessTokenUseCase.execute(token)

      // Gán user info vào request để sử dụng trong controller
      request['user'] = user

      return true
    } catch (error) {
      // Re-throw the specific error from UseCase (with better messages)
      throw error
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
