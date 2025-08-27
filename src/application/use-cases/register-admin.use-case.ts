// src/application/use-cases/register-admin.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../domain/repositories/unit-of-work.repository';
import { RegisterAdminDto } from '../dtos/auth/register-request.dto';
import { RegisterAdminResponseDto } from '../dtos/auth/register-response.dto';
import { ConflictException } from '../../shared/exceptions/custom-exceptions';
import { PasswordService } from '../../infrastructure/services/password.service';

@Injectable()
export class RegisterAdminUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    ) {}

    async execute(dto: RegisterAdminDto): Promise<RegisterAdminResponseDto> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            // Validate unique constraints
            const usernameExists = await repos.userRepository.existsByUsername(dto.username);
            if (usernameExists) {
                throw new ConflictException('Username đã tồn tại');
            }

            if (dto.email) {
                const emailExists = await repos.userRepository.existsByEmail(dto.email);
                if (emailExists) {
                    throw new ConflictException('Email đã tồn tại');
                }
            }

            // Hash password
            const passwordHash = await this.passwordService.hashPassword(dto.password);

            // Create user (trong transaction)
            const user = await repos.userRepository.create({
                username: dto.username,
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
            });

            // Create admin (trong cùng transaction)
            const admin = await repos.adminRepository.create({
                userId: user.userId,
                subject: dto.subject,
            });

            return {
                success: true,
                message: 'Đăng ký admin thành công',
                data: {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    adminId: admin.adminId,
                    subject: admin.subject,
                },
            };
        });
    }
}
