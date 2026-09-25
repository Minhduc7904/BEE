import { Inject, Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { JwtTokenService, PasswordService, TokenHashService } from '../../../interfaces'
import { BaseResponseDto, LoginParentRequestDto, LoginResponseDto, ParentResponseDto, TokensDto } from '../../../dtos'
import { UnauthorizedException } from '../../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../../shared/utils'
import { ParentStudentSummaryService } from './parent-student-summary.service'
import { loadParentNotificationSettings } from '../../parent-notification/parent-notification-access'

@Injectable()
export class LoginParentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
    @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
    private readonly studentSummaryService?: ParentStudentSummaryService,
  ) {}

  async execute(dto: LoginParentRequestDto): Promise<BaseResponseDto<LoginResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const phone = PhoneUtil.normalizeVietnamesePhone(dto.phone)
      const parent = await repos.parentRepository.findByPhone(phone, {
        includeUser: true,
        includeStudents: true,
      })

      if (!parent?.user) {
        throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng')
      }

      if (!parent.user.isActive) {
        throw new UnauthorizedException('Tài khoản này đã bị khóa. Vui lòng liên hệ admin.')
      }

      const isPasswordValid = await this.passwordService.comparePassword(dto.password, parent.user.passwordHash)

      if (!isPasswordValid) {
        throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng')
      }

      await repos.userRefreshTokenRepository.revokeAllUserTokens(parent.userId)
      // Chỉ thiết bị vừa đăng nhập (cùng deviceId) được giữ lại nhận thông báo; thiết bị khác đã bị đăng xuất.
      await repos.userDeviceRepository.deleteByUserIdExceptDevice(parent.userId, dto.deviceId)
      await repos.userRepository.update(parent.userId, { lastLoginAt: new Date() })

      const payload = {
        sub: parent.userId,
        username: parent.user.username,
        userType: 'parent' as const,
        parentId: parent.parentId,
        adminId: undefined,
        studentId: undefined,
      }
      const accessToken = await this.jwtTokenService.generateAccessToken(payload)
      const refreshToken = await this.jwtTokenService.generateRefreshToken(payload)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await repos.userRefreshTokenRepository.create({
        userId: parent.userId,
        familyId: uuidv4(),
        tokenHash: await this.tokenHashService.hashToken(refreshToken),
        expiresAt,
        userAgent: dto.userAgent,
        ipAddress: dto.ipAddress,
        deviceFingerprint: dto.deviceFingerprint,
      })

      const tokens: TokensDto = {
        accessToken,
        refreshToken,
        expiresIn: this.jwtTokenService.getAccessTokenExpirationTime(),
      }
      const notificationSettings = await loadParentNotificationSettings(repos, parent.userId, parent.parentId)
      return { tokens, parent, notificationSettings }
    })
    const linkedStudents = (result.parent.studentLinks ?? [])
      .map((link) => link.student)
      .filter((student): student is NonNullable<typeof student> => student !== undefined)
    const students = this.studentSummaryService
      ? await this.studentSummaryService.createMany(linkedStudents)
      : undefined
    const user = ParentResponseDto.fromParent(result.parent, students, result.notificationSettings)
    return BaseResponseDto.success('Đăng nhập thành công', {
      tokens: result.tokens,
      user,
    })
  }
}
