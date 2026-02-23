// src/shared/guards/video-stream-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { VerifyAccessTokenUseCase } from '../../application/use-cases/auth/verify-access-token.use-case'

/**
 * VideoStreamAuthGuard
 * 
 * Special guard for video streaming endpoints that extracts JWT token from query parameter
 * instead of Authorization header.
 * 
 * WHY QUERY PARAMETER?
 * - HTML5 <video> element cannot send custom headers (like Authorization)
 * - Browser automatically makes GET requests when loading video src
 * - Only way to authenticate is via query parameter: ?token=xxx
 * 
 * USAGE:
 * @UseGuards(VideoStreamAuthGuard)
 * streamVideo(@Query('token') token: string, @CurrentUser('studentId') studentId: number)
 * 
 * @layer Shared (Presentation)
 * @dependencies VerifyAccessTokenUseCase (Application)
 */
@Injectable()
export class VideoStreamAuthGuard implements CanActivate {
  constructor(
    private readonly verifyAccessTokenUseCase: VerifyAccessTokenUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    
    // Extract token from query parameter
    const token = this.extractTokenFromQuery(request)
    
    if (!token) {
      throw new UnauthorizedException('Access token is required in query parameter: ?token=xxx')
    }

    try {
      // Verify token using Application layer UseCase (Clean Architecture compliant)
      const user = await this.verifyAccessTokenUseCase.execute(token)

      // Attach user info to request for use in controller/decorators
      request['user'] = user

      return true
    } catch (error) {
      // Re-throw specific error from UseCase
      throw error
    }
  }

  /**
   * Extract JWT token from query parameter
   * Supports both ?token=xxx and URL-encoded format
   */
  private extractTokenFromQuery(request: Request): string | undefined {
    const token = request.query.token
    
    if (!token) {
      return undefined
    }

    // Handle both string and string[] from query parser
    if (Array.isArray(token)) {
      const firstToken = token[0]
      // Type guard: ensure it's a string, not ParsedQs
      return typeof firstToken === 'string' ? firstToken : undefined
    }

    // Type guard: ensure it's a string, not ParsedQs
    return typeof token === 'string' ? token : undefined
  }
}
