// src/application/use-cases/profile/update-student-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { StudentResponseDto, UpdateStudentDto, UpdateUserDto, BaseResponseDto } from '../../dtos'
import {
    NotFoundException,
    ConflictException,
    BusinessLogicException,
    ForbiddenException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateStudentProfileUseCase {
    constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) { }

    async execute(
        userId: number,
        dto: UpdateStudentDto,
    ): Promise<BaseResponseDto<StudentResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Tìm student theo userId
            const student = await repos.studentRepository.findByUserId(userId)
            if (!student) {
                throw new NotFoundException('Student profile not found')
            }

            if (!student.user) {
                throw new BusinessLogicException('Student user information not found')
            }

            if (!student.user.isActive) {
                throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
            }

            // 2. Kiểm tra unique constraints trước khi cập nhật
            await this.validateUniqueConstraints(repos, student.user.userId, dto)

            // 3. Tách data cho User và Student
            const userUpdateData: UpdateUserDto = {}
            const studentUpdateData: {
                studentPhone?: string
                parentPhone?: string
                grade?: number
                school?: string
            } = {}

            // Tách các trường của User
            if (dto.username !== undefined) userUpdateData.username = dto.username
            if (dto.email !== undefined) userUpdateData.email = dto.email
            if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName
            if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName
            if (dto.gender !== undefined) userUpdateData.gender = dto.gender
            if (dto.dateOfBirth !== undefined) userUpdateData.dateOfBirth = dto.dateOfBirth

            // Tách các trường của Student
            if (dto.studentPhone !== undefined) studentUpdateData.studentPhone = dto.studentPhone
            if (dto.parentPhone !== undefined) studentUpdateData.parentPhone = dto.parentPhone
            if (dto.grade !== undefined) studentUpdateData.grade = dto.grade
            if (dto.school !== undefined) studentUpdateData.school = dto.school

            // 4. Kiểm tra xem có thay đổi thực sự không
            const hasUserChanges = this.hasRealChanges(student.user, userUpdateData)
            const hasStudentChanges = this.hasRealChanges(student, studentUpdateData)

            if (!hasUserChanges && !hasStudentChanges) {
                // Không có thay đổi gì, trả về student hiện tại
                const response = StudentResponseDto.fromUserWithStudent(student.user, student)
                return BaseResponseDto.success('No changes detected', response)
            }

            // 5. Cập nhật User nếu có thay đổi
            if (hasUserChanges) {
                await repos.userRepository.update(student.user.userId, userUpdateData)
            }

            // 6. Cập nhật Student nếu có thay đổi
            if (hasStudentChanges) {
                await repos.studentRepository.update(student.studentId, studentUpdateData)
            }

            // 7. Lấy lại student đã cập nhật với thông tin user mới
            const updatedStudent = await repos.studentRepository.findById(student.studentId)
            if (!updatedStudent) {
                throw new BusinessLogicException('Unable to retrieve student profile after update')
            }

            const response = StudentResponseDto.fromUserWithStudent(updatedStudent.user, updatedStudent)
            return BaseResponseDto.success('Update student profile successfully', response)
        })
    }

    /**
     * Validate unique constraints cho username và email
     */
    private async validateUniqueConstraints(
        repos: any,
        currentUserId: number,
        dto: UpdateStudentDto,
    ): Promise<void> {
        // Kiểm tra username unique
        if (dto.username) {
            const existingUser = await repos.userRepository.findByUsername(dto.username)
            if (existingUser && existingUser.userId !== currentUserId) {
                throw new ConflictException(`Username '${dto.username}' is already in use`)
            }
        }

        // Kiểm tra email unique
        if (dto.email) {
            const existingUser = await repos.userRepository.findByEmail(dto.email)
            if (existingUser && existingUser.userId !== currentUserId) {
                throw new ConflictException(`Email '${dto.email}' is already in use`)
            }
        }
    }

    /**
     * Helper method để kiểm tra xem có thay đổi thực sự không
     */
    private hasRealChanges(currentData: any, updateData: any): boolean {
        for (const key in updateData) {
            if (updateData[key] !== undefined && updateData[key] !== currentData[key]) {
                return true
            }
        }
        return false
    }
}
