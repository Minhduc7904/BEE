import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation
} from '@nestjs/swagger'
import {
  LogoutUseCase,
  RefreshTokenUseCase,
  LoginAdminUseCase,
  LoginStudentUseCase,
  RegisterStudentUseCase,
  RegisterAdminUseCase
} from '../../application/use-cases'
import {
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  LogoutRequestDto,
  LogoutResponseDto,
  LoginResponseDto,
  BaseResponseDto,
  RegisterAdminResponseDto,
  RegisterStudentResponseDto,
  RegisterAdminDto,
  RegisterStudentDto,
  LoginRequestDto
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerAdminUseCase: RegisterAdminUseCase,
    private readonly registerStudentUseCase: RegisterStudentUseCase,
    private readonly loginAdminUseCase: LoginAdminUseCase,
    private readonly loginStudentUseCase: LoginStudentUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) { }

  @Post('/admin/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản admin' })
  async registerAdmin(@Body() dto: RegisterAdminDto): Promise<RegisterAdminResponseDto> {
    return ExceptionHandler.execute(() => this.registerAdminUseCase.execute(dto))
  }

  @Post('/student/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản học sinh' })
  async registerStudent(@Body() dto: RegisterStudentDto): Promise<RegisterStudentResponseDto> {
    return ExceptionHandler.execute(() => this.registerStudentUseCase.execute(dto))
  }

  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản admin' })
  async loginAdmin(@Body() loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginAdminUseCase.execute(loginDto))
  }

  @Post('/student/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản học sinh' })
  async loginStudent(@Body() loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginStudentUseCase.execute(loginDto))
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  async refreshToken(@Body() refreshDto: RefreshTokenRequestDto): Promise<BaseResponseDto<RefreshTokenResponseDto>> {
    return ExceptionHandler.execute(() => this.refreshTokenUseCase.execute(refreshDto))
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và revoke refresh token' })
  @AuthOnly()
  async logout(@Body() logoutDto: LogoutRequestDto): Promise<BaseResponseDto<LogoutResponseDto>> {
    return ExceptionHandler.execute(() => this.logoutUseCase.execute(logoutDto))
  }
}
