// src/application/use-cases/auth/google-oauth-admin.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../../../domain/repositories/unit-of-work.repository';
import { PasswordService } from '../../../../infrastructure/services/password.service';
import { JwtTokenService } from '../../../../infrastructure/services/jwt.service';
import { TokenHashService } from '../../../../infrastructure/services/token-hash.service';
import { GoogleUserProfileDto } from '../../../dtos/auth/google-auth.dto';
import { LoginResponseDto, TokensDto } from '../../../dtos/auth/login-response.dto';
import { BaseResponseDto } from '../../../dtos/common/base-response.dto';
import {
    ConflictException,
    ValidationException,
    UnauthorizedException
} from '../../../../shared/exceptions/custom-exceptions';
import { v4 as uuidv4 } from 'uuid';
import { AdminResponseDto } from '../../../dtos/admin/admin.dto';

@Injectable()
export class GoogleOAuthAdminUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
        @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
        @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
    ) { }

    async execute(googleProfile: GoogleUserProfileDto): Promise<BaseResponseDto<LoginResponseDto>> {
        return await this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Kiểm tra user đã tồn tại chưa
            let existingUser = await repos.userRepository.findByEmail(googleProfile.email);

            let user, admin, adminId: number;

            if (existingUser) {
                // User đã tồn tại, kiểm tra có phải admin không
                user = existingUser;
                if (!existingUser.isActive) {
                    throw new UnauthorizedException('Tài khoản này đã bị khóa. Vui lòng liên hệ admin.');
                }
                // Kiểm tra user type - chỉ cho phép admin
                const userWithDetails = await repos.userRepository.findByUsernameWithDetails(user.username);
                if (userWithDetails?.admin) {
                    adminId = userWithDetails.admin.adminId;
                    admin = userWithDetails.admin;
                    user = userWithDetails.user;
                } else {
                    throw new UnauthorizedException('Tài khoản này không có quyền admin. Vui lòng sử dụng đăng nhập cho sinh viên.');
                }
            } else {
                // Tạo user mới với role admin
                const username = this.generateUsernameFromEmail(googleProfile.email);

                // Kiểm tra username đã tồn tại chưa
                const existingByUsername = await repos.userRepository.existsByUsername(username);
                if (existingByUsername) {
                    throw new ConflictException('Username đã tồn tại');
                }

                // Tạo password ngẫu nhiên cho Google OAuth user
                const randomPassword = uuidv4();
                const hashedPassword = await this.passwordService.hashPassword(randomPassword);

                // Tạo user
                user = await repos.userRepository.create({
                    username,
                    email: googleProfile.email,
                    passwordHash: hashedPassword,
                    firstName: googleProfile.firstName,
                    lastName: googleProfile.lastName,
                    isActive: true,
                    isEmailVerified: true,
                    emailVerifiedAt: new Date(),
                });

                // Tạo admin profile
                admin = await repos.adminRepository.create({
                    userId: user.userId,
                    subjectId: undefined, // Có thể set sau
                });

                adminId = admin.adminId;
            }

            // 2. Revoke tất cả refresh tokens cũ (single device login)
            await repos.userRefreshTokenRepository.revokeAllUserTokens(user.userId);

            const isEmailVerified = user.isEmailVerified;
            if (!isEmailVerified) {
                const existingVerifiedUser = await repos.userRepository.findByEmail(user.email!);
                if (existingVerifiedUser) {
                    throw new ConflictException('Email is already verified by another user');
                }
                await repos.userRepository.update(user.userId, {
                    isEmailVerified: true,
                    emailVerifiedAt: new Date(),
                });
                user.isEmailVerified = true;
                user.emailVerifiedAt = new Date();
            }
            await repos.userRepository.update(user.userId, {
                lastLoginAt: new Date(),
            });

            // 3. Generate JWT tokens
            const payload = {
                sub: user.userId,
                username: user.username,
                userType: 'admin' as const,
                adminId,
                studentId: undefined,
            };

            const accessToken = await this.jwtTokenService.generateAccessToken(payload);
            const refreshToken = await this.jwtTokenService.generateRefreshToken(payload);

            // 4. Lưu refresh token
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const tokenHash = await this.tokenHashService.hashToken(refreshToken);
            const familyId = uuidv4();

            await repos.userRefreshTokenRepository.create({
                userId: user.userId,
                familyId,
                tokenHash,
                expiresAt,
                userAgent: undefined,
                ipAddress: undefined,
                deviceFingerprint: undefined
            });

            return {
                success: true,
                message: 'Đăng nhập Google Admin thành công',
                data: {
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: 3600
                    },
                    user: AdminResponseDto.fromUserWithAdmin(user, admin)
                }
            };
        });
    }

    private generateUsernameFromEmail(email: string): string {
        const localPart = email.split('@')[0];
        // Thêm prefix admin và timestamp để đảm bảo unique
        const timestamp = Date.now().toString().slice(-6);
        return `admin_${localPart}_${timestamp}`;
    }
}
