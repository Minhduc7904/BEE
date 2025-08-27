// src/application/use-cases/register-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../domain/repositories/unit-of-work.repository';
import { RegisterStudentDto } from '../dtos/auth/register-request.dto';
import { RegisterStudentResponseDto } from '../dtos/auth/register-response.dto';
import { ConflictException } from '../../shared/exceptions/custom-exceptions';
import { PasswordService } from '../../infrastructure/services/password.service';

@Injectable()
export class RegisterStudentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    ) {}

    async execute(dto: RegisterStudentDto): Promise<RegisterStudentResponseDto> {
        return this.unitOfWork.executeInTransaction(async () => {
            // Validate unique constraints
            const usernameExists = await this.unitOfWork.userRepository.existsByUsername(dto.username);
            if (usernameExists) {
                throw new ConflictException('Username đã tồn tại');
            }

            if (dto.email) {
                const emailExists = await this.unitOfWork.userRepository.existsByEmail(dto.email);
                if (emailExists) {
                    throw new ConflictException('Email đã tồn tại');
                }
            }

            // Hash password
            const passwordHash = await this.passwordService.hashPassword(dto.password);
            // Create user (trong transaction)
            const user = await this.unitOfWork.userRepository.create({
                username: dto.username,
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
            });

            // Create student (trong cùng transaction)
            const student = await this.unitOfWork.studentRepository.create({
                userId: user.userId,
                studentPhone: dto.studentPhone,
                parentPhone: dto.parentPhone,
                grade: dto.grade,
                school: dto.school,
            });

            return {
                success: true,
                message: 'Đăng ký học sinh thành công',
                data: {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    studentId: student.studentId,
                    grade: student.grade,
                    school: student.school,
                    studentPhone: student.studentPhone,
                    parentPhone: student.parentPhone,
                },
            };
        });
    }
}
