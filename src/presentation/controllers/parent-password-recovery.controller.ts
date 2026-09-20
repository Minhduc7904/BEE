import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  GetParentRecoveryStudentsUseCase,
  ResetParentPasswordUseCase,
  VerifyParentRecoveryUseCase,
} from '../../application/use-cases'
import {
  BaseResponseDto,
  GetParentRecoveryStudentsDto,
  GetParentRecoveryStudentsResultDto,
  ResetParentPasswordDto,
  ResetParentPasswordResultDto,
  VerifyParentRecoveryDto,
  VerifyParentRecoveryResultDto,
} from '../../application/dtos'
import { RateLimitExceededException } from '../../shared/exceptions/custom-exceptions'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { PhoneUtil } from '../../shared/utils'
import { RecoveryRateLimitService } from '../services/recovery-rate-limit.service'

@Controller('auth/parent/password-recovery')
export class ParentPasswordRecoveryController {
  constructor(
    private readonly getStudentsUseCase: GetParentRecoveryStudentsUseCase,
    private readonly verifyUseCase: VerifyParentRecoveryUseCase,
    private readonly resetPasswordUseCase: ResetParentPasswordUseCase,
    private readonly rateLimit: RecoveryRateLimitService,
  ) {}

  @Post('students')
  @HttpCode(HttpStatus.OK)
  async getStudents(
    @Body() dto: GetParentRecoveryStudentsDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponseDto<GetParentRecoveryStudentsResultDto>> {
    this.enforceRateLimit(
      'students',
      `${request.ip}:${PhoneUtil.normalizeVietnamesePhone(dto.phone)}`,
      5,
      60_000,
      response,
    )
    return ExceptionHandler.execute(() => this.getStudentsUseCase.execute(dto))
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body() dto: VerifyParentRecoveryDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponseDto<VerifyParentRecoveryResultDto>> {
    this.enforceRateLimit(
      'verify',
      `${request.ip}:${PhoneUtil.normalizeVietnamesePhone(dto.phone)}`,
      5,
      15 * 60_000,
      response,
    )
    return ExceptionHandler.execute(() => this.verifyUseCase.execute(dto))
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async reset(
    @Body() dto: ResetParentPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponseDto<ResetParentPasswordResultDto>> {
    this.enforceRateLimit('reset', `${request.ip}:${dto.token}`, 5, 15 * 60_000, response)
    return ExceptionHandler.execute(() => this.resetPasswordUseCase.execute(dto))
  }

  private enforceRateLimit(scope: string, tracker: string, limit: number, windowMs: number, response: Response): void {
    const retryAfter = this.rateLimit.consume(scope, tracker, limit, windowMs)
    if (retryAfter === null) return

    response.setHeader('Retry-After', retryAfter.toString())
    throw new RateLimitExceededException('Bạn thao tác quá nhiều lần. Vui lòng thử lại sau')
  }
}
