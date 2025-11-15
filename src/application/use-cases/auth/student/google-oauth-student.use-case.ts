// src/application/use-cases/auth/google-oauth-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../../domain/repositories'
import {
  TokenHashService,
  JwtTokenService,
  PasswordService
} from '../../../../infrastructure/services'
import {
  LoginResponseDto,
  BaseResponseDto,
  StudentResponseDto,
  GoogleUserProfileDto
} from '../../../dtos'
import {
  ConflictException,
  UnauthorizedException,
} from '../../../../shared/exceptions/custom-exceptions'
import { StorageProvider } from '../../../../shared/enums'
import { MediaType, MediaStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { ROLE_IDS } from 'src/shared/constants'

@Injectable()
export class GoogleOAuthStudentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
    @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
  ) { }

  async execute(googleProfile: GoogleUserProfileDto): Promise<BaseResponseDto<LoginResponseDto>> {
    return await this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Kiểm tra user đã tồn tại chưa
      // console.log(googleProfile);
      let existingUser = await repos.userRepository.findByEmail(googleProfile.email)
      // console.log(existingUser);
      let user, student, studentId: number

      if (existingUser) {
        // User đã tồn tại, kiểm tra có phải student không
        user = existingUser
        if (!existingUser.isActive) {
          throw new UnauthorizedException('Tài khoản này đã bị khóa. Vui lòng liên hệ admin.')
        }
        // Kiểm tra user type - chỉ cho phép student
        const userWithDetails = await repos.userRepository.findByUsernameWithDetails(user.username)
        // console.log(userWithDetails);
        // console.log(userWithDetails?.student);
        if (userWithDetails?.student) {
          studentId = userWithDetails.student.studentId
          student = userWithDetails.student
          user = userWithDetails.user
        } else {
          throw new UnauthorizedException(
            'Tài khoản này không phải tài khoản sinh viên. Vui lòng sử dụng đăng nhập cho admin.',
          )
        }
      } else {
        // Tạo user mới với role student
        const username = this.generateUsernameFromEmail(googleProfile.email)

        // Kiểm tra username đã tồn tại chưa
        const existingByUsername = await repos.userRepository.existsByUsername(username)
        if (existingByUsername) {
          throw new ConflictException('Username đã tồn tại')
        }

        // Tạo password ngẫu nhiên cho Google OAuth user
        const randomPassword = uuidv4()
        const hashedPassword = await this.passwordService.hashPassword(randomPassword)

        let avatarId: number | undefined = undefined
        // Nếu Google cung cấp avatar, upload trước với uploadedBy null
        if (googleProfile.picture) {
          try {
            const avatar = await repos.mediaRepository.create({
              bucketName: 'images', // Bucket cho avatar
              objectKey: `avatars/google_${username}_${Date.now()}.jpg`,
              originalFilename: 'google_avatar.jpg',
              mimeType: 'image/jpeg',
              fileSize: 0, // Google avatar external URL
              type: 'IMAGE' as MediaType,
              status: 'READY' as MediaStatus,
              publicUrl: googleProfile.picture, // URL từ Google
              uploadedBy: null, // Tạm thời null, sẽ update sau
            })
            avatarId = avatar.mediaId
          } catch (error) {
            console.warn('Failed to save Google avatar:', error.message)
          }
        }

        // Tạo user
        const createdUser = await repos.userRepository.create({
          username,
          email: googleProfile.email,
          passwordHash: hashedPassword,
          firstName: googleProfile.firstName,
          lastName: googleProfile.lastName,
          isActive: true,
          avatarId,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        })

        // Update uploadedBy sau khi có userId
        if (avatarId) {
          try {
            await repos.mediaRepository.update(avatarId, {
              uploadedBy: createdUser.userId,
            })
          } catch (error) {
            console.warn('Failed to update avatar uploadedBy:', error.message)
          }
        }

        // console.log('createdUser', createdUser);

        const userWithDetails = await repos.userRepository.findByUsernameWithDetails(createdUser.username)
        if (!userWithDetails) {
          throw new UnauthorizedException('Tài khoản này không phải tài khoản sinh viên. Vui lòng sử dụng đăng nhập cho admin.')
        }
        user = userWithDetails.user
        // Tạo student profile mặc định
        student = await repos.studentRepository.create({
          userId: user.userId,
          grade: 12, // Mặc định lớp 12
          school: undefined,
          studentPhone: undefined,
          parentPhone: undefined,
        })

        studentId = student.studentId

        const role = await repos.roleRepository.assignRoleToUser(user.userId, ROLE_IDS.STUDENT)
        // console.log('role', role);
      }
      // 2. Revoke tất cả refresh tokens cũ (single device login)
      await repos.userRefreshTokenRepository.revokeAllUserTokens(user.userId)

      const isEmailVerified = user.isEmailVerified
      const userEmail = user.email! // Lưu email vào biến để tránh bị modify
      if (!isEmailVerified) {
        const existingVerifiedUser = await repos.userRepository.findByEmail(userEmail)
        if (existingVerifiedUser) {
          throw new ConflictException('Email is already verified by another user')
        }
        await repos.userRepository.update(user.userId, {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        })
        user.isEmailVerified = true
        user.emailVerifiedAt = new Date()
      }
      await repos.userRepository.update(user.userId, {
        lastLoginAt: new Date(),
      })

      // 3. Generate JWT tokens
      const payload = {
        sub: user.userId,
        username: user.username,
        userType: 'student' as const,
        adminId: undefined,
        studentId,
      }

      const accessToken = await this.jwtTokenService.generateAccessToken(payload)
      const refreshToken = await this.jwtTokenService.generateRefreshToken(payload)

      // 4. Lưu refresh token
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const tokenHash = await this.tokenHashService.hashToken(refreshToken)
      const familyId = uuidv4()

      await repos.userRefreshTokenRepository.create({
        userId: user.userId,
        familyId,
        tokenHash,
        expiresAt,
        userAgent: undefined,
        ipAddress: undefined,
        deviceFingerprint: undefined,
      })
      // console.log('Login successful', StudentResponseDto.fromUserWithStudent(user, student));
      return {
        success: true,
        message: 'Đăng nhập Google Student thành công',
        data: {
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600,
          },
          user: StudentResponseDto.fromUserWithStudent(user, student),
        },
      }
    })
  }

  private generateUsernameFromEmail(email: string): string {
    const localPart = email.split('@')[0]
    // Thêm prefix student và timestamp để đảm bảo unique
    const timestamp = Date.now().toString().slice(-6)
    return `student_${localPart}_${timestamp}`
  }
}
