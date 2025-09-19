import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger'
import { RegisterAdminUseCase } from '../../application/use-cases/auth/admin/register-admin.use-case'
import { RegisterStudentUseCase } from '../../application/use-cases/auth/student/register-student.use-case'
import { LoginAdminUseCase } from '../../application/use-cases/auth/admin/login-admin.use-case'
import { LoginStudentUseCase } from '../../application/use-cases/auth/student/login-student.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case'
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case'
import { RegisterAdminDto, RegisterStudentDto } from '../../application/dtos/auth/register-request.dto'
import { LoginRequestDto } from '../../application/dtos/auth/login-request.dto'
import { RefreshTokenRequestDto, RefreshTokenResponseDto } from '../../application/dtos/auth/refresh-token.dto'
import { LogoutRequestDto, LogoutResponseDto } from '../../application/dtos/auth/logout.dto'
import { RegisterAdminResponseDto, RegisterStudentResponseDto } from '../../application/dtos/auth/register-response.dto'
import { LoginResponseDto } from '../../application/dtos/auth/login-response.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'

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
  ) {}

  @Post('/admin/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản admin' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký admin thành công',
    type: RegisterAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username hoặc email đã tồn tại',
    type: ErrorResponseDto,
  })
  async registerAdmin(@Body() dto: RegisterAdminDto): Promise<RegisterAdminResponseDto> {
    return ExceptionHandler.execute(() => this.registerAdminUseCase.execute(dto))
  }

  @Post('/student/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản học sinh' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký student thành công',
    type: RegisterStudentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username hoặc email đã tồn tại',
    type: ErrorResponseDto,
  })
  async registerStudent(@Body() dto: RegisterStudentDto): Promise<RegisterStudentResponseDto> {
    return ExceptionHandler.execute(() => this.registerStudentUseCase.execute(dto))
  }

  @Post('/admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản admin' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập admin thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Admin không tồn tại',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mật khẩu không đúng',
    type: ErrorResponseDto,
  })
  async loginAdmin(@Body() loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginAdminUseCase.execute(loginDto))
  }

  @Post('/student/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập tài khoản học sinh' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập student thành công',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student không tồn tại',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mật khẩu không đúng',
    type: ErrorResponseDto,
  })
  async loginStudent(@Body() loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return ExceptionHandler.execute(() => this.loginStudentUseCase.execute(loginDto))
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Làm mới token thành công',
    type: BaseResponseDto<RefreshTokenResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Người dùng không tồn tại',
    type: ErrorResponseDto,
  })
  async refreshToken(@Body() refreshDto: RefreshTokenRequestDto): Promise<BaseResponseDto<RefreshTokenResponseDto>> {
    return ExceptionHandler.execute(() => this.refreshTokenUseCase.execute(refreshDto))
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và revoke refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng xuất thành công',
    type: BaseResponseDto<LogoutResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Người dùng không tồn tại',
    type: ErrorResponseDto,
  })
  @AuthOnly()
  async logout(@Body() logoutDto: LogoutRequestDto): Promise<BaseResponseDto<LogoutResponseDto>> {
    return ExceptionHandler.execute(() => this.logoutUseCase.execute(logoutDto))
  }

  @Post('/logout/all-devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất khỏi tất cả thiết bị' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng xuất khỏi tất cả thiết bị thành công',
    type: BaseResponseDto<LogoutResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token không hợp lệ hoặc đã hết hạn',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Người dùng không tồn tại',
    type: ErrorResponseDto,
  })
  @AuthOnly()
  async logoutAllDevices(@Body() logoutDto: LogoutRequestDto): Promise<BaseResponseDto<LogoutResponseDto>> {
    return ExceptionHandler.execute(() => this.logoutUseCase.executeLogoutAllDevices(logoutDto))
  }
}
