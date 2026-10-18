import { Body, Controller, HttpCode, HttpStatus, Injectable, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  LogoutUseCase,
  RefreshTokenUseCase,
  LoginAdminUseCase,
  LoginStudentUseCase,
  RegisterStudentUseCase,
  RegisterAdminUseCase,
  CheckParentPhoneUseCase,
  RegisterParentUseCase,
  LoginParentUseCase,
  DeleteParentAccountPublicUseCase,
} from '../../application/use-cases'
import {
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  LogoutRequestDto,
  LogoutResponseDto,
  LoginResponseDto,
  BaseResponseDto,
  RegisterAdminResponseDto,
  RegisterAdminDto,
  RegisterStudentDto,
  LoginRequestDto,
  StudentResponseDto,
  CheckParentPhoneRequestDto,
  CheckParentPhoneResponseDto,
  RegisterParentDto,
  ParentResponseDto,
  LoginParentRequestDto,
  DeleteParentAccountPublicDto,
  DeleteParentAccountResponseDto,
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RateLimitExceededException } from '../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../shared/utils'
import { RecoveryRateLimitService } from '../services/recovery-rate-limit.service'

@Injectable()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerAdminUseCase: RegisterAdminUseCase,
    private readonly registerStudentUseCase: RegisterStudentUseCase,
    private readonly loginAdminUseCase: LoginAdminUseCase,
    private readonly loginStudentUseCase: LoginStudentUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly checkParentPhoneUseCase: CheckParentPhoneUseCase,
    private readonly registerParentUseCase: RegisterParentUseCase,
    private readonly loginParentUseCase: LoginParentUseCase,
    private readonly deleteParentAccountPublicUseCase: DeleteParentAccountPublicUseCase,
    private readonly rateLimit: RecoveryRateLimitService,
  ) {}

  @Post('/parent/check-phone')
  @HttpCode(HttpStatus.OK)
  async checkParentPhone(
    @Body() dto: CheckParentPhoneRequestDto,
  ): Promise<BaseResponseDto<CheckParentPhoneResponseDto>> {
    return ExceptionHandler.execute(() => this.checkParentPhoneUseCase.execute(dto))
  }

  @Post('/parent/register')
  @HttpCode(HttpStatus.CREATED)
  async registerParent(@Body() dto: RegisterParentDto): Promise<BaseResponseDto<ParentResponseDto>> {
    return ExceptionHandler.execute(() => this.registerParentUseCase.execute(dto))
  }

  @Post('/parent/login')
  @HttpCode(HttpStatus.OK)
  async loginParent(@Body() dto: LoginParentRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginParentUseCase.execute(dto))
  }

  @Post('/parent/account-deletion')
  @HttpCode(HttpStatus.OK)
  async deleteParentAccount(
    @Body() dto: DeleteParentAccountPublicDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponseDto<DeleteParentAccountResponseDto>> {
    const tracker = `${request.ip}:${PhoneUtil.normalizeVietnamesePhone(dto.phone)}`
    const retryAfter = this.rateLimit.consume('parent-account-deletion', tracker, 5, 15 * 60_000)
    if (retryAfter !== null) {
      response.setHeader('Retry-After', retryAfter.toString())
      throw new RateLimitExceededException('Bạn thao tác quá nhiều lần. Vui lòng thử lại sau')
    }
    return ExceptionHandler.execute(() => this.deleteParentAccountPublicUseCase.execute(dto))
  }

  // @Post('/admin/register')
  // @HttpCode(HttpStatus.CREATED)
  //   async registerAdmin(@Body() dto: RegisterAdminDto): Promise<RegisterAdminResponseDto> {
  //   return ExceptionHandler.execute(() => this.registerAdminUseCase.execute(dto))
  // }

  @Post('/student/register')
  @HttpCode(HttpStatus.CREATED)
  async registerStudent(@Body() dto: RegisterStudentDto): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.registerStudentUseCase.execute(dto))
  }

  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(@Body() loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginAdminUseCase.execute(loginDto))
  }

  @Post('/student/login')
  @HttpCode(HttpStatus.OK)
  async loginStudent(@Body() loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginStudentUseCase.execute(loginDto))
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshDto: RefreshTokenRequestDto): Promise<BaseResponseDto<RefreshTokenResponseDto>> {
    return ExceptionHandler.execute(() => this.refreshTokenUseCase.execute(refreshDto))
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: LogoutRequestDto): Promise<BaseResponseDto<LogoutResponseDto>> {
    return ExceptionHandler.execute(() => this.logoutUseCase.execute(logoutDto))
  }
}
