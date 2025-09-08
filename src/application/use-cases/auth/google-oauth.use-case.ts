// src/application/use-cases/auth/google-oauth.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { PasswordService } from '../../../infrastructure/services/password.service';
import { JwtTokenService } from '../../../infrastructure/services/jwt.service';
import { TokenHashService } from '../../../infrastructure/services/token-hash.service';
import { GoogleUserProfileDto, GoogleAuthResponseDto } from '../../dtos/auth/google-auth.dto';
import { 
    ConflictException,
    ValidationException 
} from '../../../shared/exceptions/custom-exceptions';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleOAuthUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
        @Inject('JWT_TOKEN_SERVICE') private readonly jwtTokenService: JwtTokenService,
        @Inject('TOKEN_HASH_SERVICE') private readonly tokenHashService: TokenHashService,
    ) {}

    async execute(googleProfile: GoogleUserProfileDto): Promise<GoogleAuthResponseDto> {
        return await this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Kiểm tra user đã tồn tại chưa
            let existingUser = await repos.userRepository.findByEmail(googleProfile.email);
            
            let user, userType: 'admin' | 'student';
            let adminId: number | undefined;
            let studentId: number | undefined;

            if (existingUser) {
                // User đã tồn tại, login
                user = existingUser;
                
                // Kiểm tra user type
                const userWithDetails = await repos.userRepository.findByUsernameWithDetails(user.username);
                if (userWithDetails?.admin) {
                    userType = 'admin';
                    adminId = userWithDetails.admin.adminId;
                } else if (userWithDetails?.student) {
                    userType = 'student';
                    studentId = userWithDetails.student.studentId;
                } else {
                    throw new ValidationException('User type không xác định');
                }
            } else {
                // Tạo user mới - mặc định là student
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
                });

                // Tạo student profile mặc định
                const student = await repos.studentRepository.create({
                    userId: user.userId,
                    grade: 12, // Mặc định lớp 12
                    school: undefined,
                    studentPhone: undefined,
                    parentPhone: undefined,
                });

                userType = 'student';
                studentId = student.studentId;
            }

            // 2. Revoke tất cả refresh tokens cũ (single device login)
            await repos.userRefreshTokenRepository.revokeAllUserTokens(user.userId);

            // 3. Generate JWT tokens
            const payload = {
                sub: user.userId,
                username: user.username,
                userType,
                adminId,
                studentId,
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

            // 5. Update last login
            await repos.userRepository.updateLastLogin(user.userId);

            return {
                message: 'Đăng nhập Google thành công',
                accessToken,
                refreshToken,
                user: {
                    userId: user.userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    userType,
                }
            };
        });
    }

    private generateUsernameFromEmail(email: string): string {
        const localPart = email.split('@')[0];
        // Thêm timestamp để đảm bảo unique
        const timestamp = Date.now().toString().slice(-6);
        return `${localPart}_${timestamp}`;
    }
}
