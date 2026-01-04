import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
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
  RegisterAdminDto,
  RegisterStudentDto,
  LoginRequestDto,
  StudentResponseDto,
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators'

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
