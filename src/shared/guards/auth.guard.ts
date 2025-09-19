// src/shared/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { AuthService, AuthenticatedUser } from '../../infrastructure/services/auth.service'

// Re-export for backwards compatibility
export type { AuthenticatedUser }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      throw new UnauthorizedException('Access token is required')
    }

    try {
      // Use AuthService to verify token and get user with roles
      const user = await this.authService.verifyTokenAndGetUser(token)

      // Gán user info vào request để sử dụng trong controller
      request['user'] = user

      return true
    } catch (error) {
      // Re-throw the specific error from AuthService (with better messages)
      throw error
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
