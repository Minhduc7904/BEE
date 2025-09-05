// src/application/use-cases/login-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { PasswordService } from '../../../infrastructure/services/password.service';
import { JwtTokenService } from '../../../infrastructure/services/jwt.service';
import { TokenHashService } from '../../../infrastructure/services/token-hash.service';
import { LoginRequestDto } from '../../dtos/auth/login-request.dto';
import { LoginResponseDto, TokensDto, UserInfoDto, LoginDataDto } from '../../dtos/auth/login-response.dto';
import { 
    NotFoundException, 
    ValidationException 
} from '../../../shared/exceptions/custom-exceptions';
import { UserRefreshToken } from '../../../domain/entities/user-refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';

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
    ) {}

    async execute(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
        return await this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Tìm user với student details
            const userWithDetails = await repos.userRepository.findByUsernameWithDetails(loginDto.username);
            
            if (!userWithDetails?.student) {
                throw new NotFoundException('Student không tồn tại');
            }

            const { user, student } = userWithDetails;

            // 2. Verify password
            const isPasswordValid = await this.passwordService.comparePassword(
                loginDto.password, 
                user.passwordHash
            );

            if (!isPasswordValid) {
                throw new ValidationException('Mật khẩu không đúng');
            }

            // 3. Single device login: Revoke tất cả refresh tokens cũ của user
            await repos.userRefreshTokenRepository.revokeAllUserTokens(user.userId);

            // 4. Single device login: Revoke tất cả refresh tokens cũ của user
            await repos.userRefreshTokenRepository.revokeAllUserTokens(user.userId);

            // 5. Generate JWT tokens
            const payload = {
                sub: user.userId,
                username: user.username,
                userType: 'student' as const,
                adminId: undefined,
                studentId: student.studentId
            };

            const accessToken = await this.jwtTokenService.generateAccessToken(payload);
            const refreshToken = await this.jwtTokenService.generateRefreshToken(payload);

            // 6. Lưu refresh token mới vào database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token hết hạn sau 7 ngày

            // Hash refresh token trước khi lưu
            const tokenHash = await this.tokenHashService.hashToken(refreshToken);
            const familyId = uuidv4(); // UUID cho token family

            const refreshTokenData = {
                userId: user.userId,
                familyId,
                tokenHash,
                expiresAt,
                userAgent: undefined, // Sẽ implement sau nếu cần
                ipAddress: undefined, // Sẽ implement sau nếu cần
                deviceFingerprint: undefined // Sẽ implement sau nếu cần
            };

            await repos.userRefreshTokenRepository.create(refreshTokenData);

            // 7. Tạo response theo format mới
            const tokens: TokensDto = {
                accessToken,
                refreshToken,
                expiresIn: 3600 // 1 hour
            };

            const userInfo: UserInfoDto = {
                userId: user.userId,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: 'student',
                roleDetails: {
                    studentId: student.studentId,
                    grade: student.grade,
                    school: student.school
                }
            };

            return LoginResponseDto.success(
                'Đăng nhập thành công',
                { tokens, user: userInfo } as LoginDataDto
            ) as LoginResponseDto;
        });
    }
}
