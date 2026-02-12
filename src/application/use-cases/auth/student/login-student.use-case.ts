// src/application/use-cases/login-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../../domain/repositories'
import {
  TokenHashService,
  JwtTokenService,
  PasswordService
} from '../../../../infrastructure/services'
import {
  LoginRequestDto,
  LoginResponseDto,
  TokensDto,
  BaseResponseDto,
  StudentResponseDto
} from '../../../dtos'
import {
  NotFoundException,
  ValidationException
} from '../../../../shared/exceptions/custom-exceptions'
import { v4 as uuidv4 } from 'uuid'
/**
 * Use case cho student login với single device login
 */
@Injectable()
export class LoginStudentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
    @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
  ) { }

  async execute(loginDto: LoginRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return await this.unitOfWork.executeInTransaction(async (repos) => {
      if (!loginDto.username && !loginDto.email) {
        throw new ValidationException('Tên đăng nhập hoặc email không được để trống')
      }
      if (loginDto.username && loginDto.email) {
        throw new ValidationException('Vui lòng chỉ nhập tên đăng nhập hoặc email, không cả hai')
      }

      // 1. Tìm user với student details
      let userWithDetails
      if (loginDto.username) {
        userWithDetails = await repos.userRepository.findByUsernameWithDetails(loginDto.username)
      } else if (loginDto.email) {
        userWithDetails = await repos.userRepository.findByEmailWithDetails(loginDto.email)
      }

      if (!userWithDetails) {
        throw new NotFoundException('Mật khẩu hoặc tên đăng nhập/email không đúng')
      }

      if (!userWithDetails?.student) {
        throw new NotFoundException('Mật khẩu hoặc tên đăng nhập/email không đúng')
      }

      if (!userWithDetails.user.isActive) {
        throw new NotFoundException('Tài khoản này đã bị khóa. Vui lòng liên hệ admin.')
      }

      const { user, student } = userWithDetails
      // 2. Verify password
      const isPasswordValid = await this.passwordService.comparePassword(loginDto.password, user.passwordHash)

      if (!isPasswordValid) {
        throw new ValidationException('Mật khẩu hoặc tên đăng nhập/email không đúng')
      }

      // 3. Single device login: Revoke tất cả refresh tokens cũ của user
      await repos.userRefreshTokenRepository.revokeAllUserTokens(user.userId)

      await repos.userRepository.update(user.userId, { lastLoginAt: new Date() })

      // 4. Generate JWT tokens
      const payload = {
        sub: user.userId,
        username: user.username,
        userType: 'student' as const,
        adminId: undefined,
        studentId: student.studentId,
      }

      const accessToken = await this.jwtTokenService.generateAccessToken(payload)
      const refreshToken = await this.jwtTokenService.generateRefreshToken(payload)

      // 5. Lưu refresh token mới vào database
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Refresh token hết hạn sau 7 ngày

      // Hash refresh token trước khi lưu
      const tokenHash = await this.tokenHashService.hashToken(refreshToken)
      const familyId = uuidv4() // UUID cho token family

      const refreshTokenData = {
        userId: user.userId,
        familyId,
        tokenHash,
        expiresAt,
        userAgent: loginDto.userAgent,
        ipAddress: loginDto.ipAddress,
        deviceFingerprint: loginDto.deviceFingerprint,
      }
      console.log('refreshTokenData', refreshTokenData)
      await repos.userRefreshTokenRepository.create(refreshTokenData)

      // 6. Tạo response theo format mới
      const tokens: TokensDto = {
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      }

      const userInfo: StudentResponseDto = StudentResponseDto.fromUserWithStudent(user, student)

      return BaseResponseDto.success('Đăng nhập thành công', { tokens, user: userInfo } as LoginResponseDto)
    })
  }
}
