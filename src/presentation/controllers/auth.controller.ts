import { Body, Controller, HttpCode, HttpStatus, Injectable, Post } from '@nestjs/common'
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
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

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
