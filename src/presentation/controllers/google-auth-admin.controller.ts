// src/presentation/controllers/google-auth-admin.controller.ts
import { Controller, Get, UseGuards, Req, Res, HttpStatus, HttpCode } from '@nestjs/common'
import type { Request, Response } from 'express'
import { GoogleOAuthAdminGuard } from '../../shared/guards/google-oauth-admin.guard'
import { GoogleOAuthAdminUseCase } from '../../application/use-cases/auth/admin/google-oauth-admin.use-case'
import { GoogleUserProfileDto } from '../../application/dtos/auth/google-auth.dto'
import { LoginResponseDto, ErrorResponseDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('auth/google/admin')
export class GoogleAuthAdminController {
  constructor(private readonly googleOAuthAdminUseCase: GoogleOAuthAdminUseCase) {}

  @Get()
  @UseGuards(GoogleOAuthAdminGuard)
      async googleAuthAdmin() {
    // Guard sẽ handle redirect
  }

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(GoogleOAuthAdminGuard)
            async googleAuthAdminRedirect(@Req() req: Request, @Res() res: Response) {
    return ExceptionHandler.execute(async () => {
      const googleProfile = req.user as GoogleUserProfileDto

      if (!googleProfile) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Lỗi xác thực Google',
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: '/auth/google/admin/callback',
        })
      }

      const result = await this.googleOAuthAdminUseCase.execute(googleProfile)

      // Option 1: Return JSON (for API)
      return res.status(HttpStatus.OK).json(result)

      // Option 2: Redirect to admin frontend with token (uncomment nếu cần)
      // const frontendUrl = process.env.ADMIN_FRONTEND_URL || 'http://localhost:3000/admin';
      // const redirectUrl = `${frontendUrl}/auth/success?token=${result.accessToken}&refresh=${result.refreshToken}`;
      // return res.redirect(redirectUrl);
    })
  }
}
