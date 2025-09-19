// src/application/use-cases/register-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../../domain/repositories/unit-of-work.repository'
import { RegisterStudentDto } from '../../../dtos/auth/register-request.dto'
import { RegisterStudentResponseDto } from '../../../dtos/auth/register-response.dto'
import { StudentResponseDto } from '../../../dtos/student/student.dto'
import { ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import { PasswordService } from '../../../../infrastructure/services/password.service'

@Injectable()
export class RegisterStudentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: RegisterStudentDto): Promise<RegisterStudentResponseDto> {
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
        isActive: true,
        isEmailVerified: false,
      })

      // Create student (trong cùng transaction)
      const student = await repos.studentRepository.create({
        userId: user.userId,
        studentPhone: dto.studentPhone,
        parentPhone: dto.parentPhone,
        grade: dto.grade,
        school: dto.school,
      })

      return {
        success: true,
        message: 'Đăng ký học sinh thành công',
        data: StudentResponseDto.fromUserWithStudent(user, student),
      }
    })
  }
}
