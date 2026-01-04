// src/application/use-cases/student/create-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import {
    RegisterStudentDto,
    StudentResponseDto,
    BaseResponseDto
} from '../../dtos'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { PasswordService } from '../../../infrastructure/services'
import { ACTION_KEYS } from 'src/shared/constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'

@Injectable()
export class CreateStudentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    ) { }

    async execute(dto: RegisterStudentDto, createdBy: number): Promise<BaseResponseDto<StudentResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            // Validate unique constraints
            const usernameExists = await repos.userRepository.existsByUsername(dto.username)
            if (usernameExists) {
                throw new ConflictException('Username đã tồn tại')
            }

            if (dto.email) {
                const emailExists = await repos.userRepository.existsByEmail(dto.email)
                if (emailExists) {
                    throw new ConflictException('Email đã tồn tại')
                }
            }

            // Hash password
            const passwordHash = await this.passwordService.hashPassword(dto.password)

            // Create user (trong transaction)
            const user = await repos.userRepository.create({
                username: dto.username,
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                gender: dto.gender,
                dateOfBirth: dto.dateOfBirth,
                isActive: true,
                isEmailVerified: false,
            })

            await repos.roleRepository.assignRoleToUser(user.userId, 4);

            // Create student (trong cùng transaction)
            const student = await repos.studentRepository.create({
                userId: user.userId,
                studentPhone: dto.studentPhone,
                parentPhone: dto.parentPhone,
                grade: dto.grade,
                school: dto.school,
            })

            await repos.adminAuditLogRepository.create({
                adminId: createdBy,
                actionKey: ACTION_KEYS.STUDENT.CREATE,
                status: AuditStatus.SUCCESS,
                resourceType: 'Student',
                resourceId: student.studentId.toString(),
                afterData: {
                    studentId: student.studentId,
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                },
            })

            // Fetch student with user details để trả về đầy đủ thông tin
            const studentWithUser = await repos.studentRepository.findById(student.studentId)

            return BaseResponseDto.success(
                'Tạo học sinh thành công',
                StudentResponseDto.fromStudentEntity(studentWithUser),
            )
        })
    }
}
