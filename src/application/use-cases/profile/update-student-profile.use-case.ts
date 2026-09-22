// src/application/use-cases/profile/update-student-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { UpdateUserData } from '../../../domain/repositories/user.repository'
import { UpdateStudentData } from '../../../domain/interface/student/student.interface'
import { Student } from '../../../domain/entities'
import { StudentResponseDto, UpdateStudentDto, BaseResponseDto } from '../../dtos'
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
        // Tự đổi username/loại học sinh là thao tác chỉ admin mới được phép (route /students/:id)
        if (dto.username !== undefined) {
            throw new ForbiddenException('Chỉ quản trị viên mới được thay đổi tên đăng nhập')
        }
        if (dto.studentType !== undefined) {
            throw new ForbiddenException('Chỉ quản trị viên mới được thay đổi loại học sinh')
        }

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

            // 2. Kiểm tra unique constraints trước khi cập nhật - chỉ với trường thực sự thay đổi
            await this.validateUniqueConstraints(repos, student, dto)

            // 3. Tách data cho User và Student - chỉ đưa vào trường có mặt trong request
            const userUpdateData: UpdateUserData = {}
            const studentUpdateData: UpdateStudentData = {}

            // Tách các trường của User
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
            if (dto.highSchoolGraduationYear !== undefined) {
                studentUpdateData.highSchoolGraduationYear = dto.highSchoolGraduationYear
            }

            // 4. Kiểm tra xem có thay đổi thực sự không
            const hasUserChanges = this.hasRealChanges(student.user, userUpdateData)
            const hasStudentChanges = this.hasRealChanges(student, studentUpdateData)

            if (!hasUserChanges && !hasStudentChanges) {
                // Không có thay đổi gì, trả về student hiện tại
                const response = StudentResponseDto.fromUserWithStudent(student.user, student)
                return BaseResponseDto.success('No changes detected', response)
            }

            // 5. Kiểm tra và reset email verification nếu email thực sự thay đổi (kể cả khi xóa email)
            if (hasUserChanges && 'email' in userUpdateData && userUpdateData.email !== (student.user.email ?? null)) {
                if (student.user.isEmailVerified) {
                    userUpdateData.isEmailVerified = false
                }
            }

            // 6. Cập nhật User nếu có thay đổi
            if (hasUserChanges) {
                await repos.userRepository.update(student.user.userId, userUpdateData)
            }

            // 7. Cập nhật Student nếu có thay đổi
            if (hasStudentChanges) {
                await repos.studentRepository.update(student.studentId, studentUpdateData)
            }

            // 8. Lấy lại student đã cập nhật với thông tin user mới
            const updatedStudent = await repos.studentRepository.findById(student.studentId)
            if (!updatedStudent) {
                throw new BusinessLogicException('Unable to retrieve student profile after update')
            }

            const response = StudentResponseDto.fromUserWithStudent(updatedStudent.user, updatedStudent)
            return BaseResponseDto.success('Update student profile successfully', response)
        })
    }

    /**
     * Validate unique constraints - chỉ kiểm tra trường nào thực sự có trong request
     * và thực sự khác giá trị hiện tại.
     */
    private async validateUniqueConstraints(
        repos: UnitOfWorkRepos,
        student: Student,
        dto: UpdateStudentDto,
    ): Promise<void> {
        const currentUser = student.user!

        // Kiểm tra email unique - chỉ khi email thực sự đổi và không phải đang xóa email
        if (dto.email && dto.email !== currentUser.email) {
            const existingUser = await repos.userRepository.findByEmail(dto.email)
            if (existingUser && existingUser.userId !== currentUser.userId) {
                throw new ConflictException(`Email '${dto.email}' is already in use`)
            }
        }

        // Kiểm tra ràng buộc unique theo cặp (studentPhone, parentPhone) - chỉ khi 1 trong 2 trường đổi
        if (dto.studentPhone !== undefined || dto.parentPhone !== undefined) {
            const finalStudentPhone = dto.studentPhone !== undefined ? dto.studentPhone : student.studentPhone
            const finalParentPhone = dto.parentPhone !== undefined ? dto.parentPhone : student.parentPhone
            const phoneChanged =
                finalStudentPhone !== (student.studentPhone ?? null) ||
                finalParentPhone !== (student.parentPhone ?? null)

            if (phoneChanged && finalStudentPhone && finalParentPhone) {
                const existing = await repos.studentRepository.findByStudentPhoneAndParentPhone(
                    finalStudentPhone,
                    finalParentPhone,
                )
                if (existing && existing.studentId !== student.studentId) {
                    throw new ConflictException(
                        `Cặp số điện thoại học sinh/phụ huynh đã được sử dụng bởi học sinh khác`,
                    )
                }
            }
        }
    }

    /**
     * Helper method để kiểm tra xem có thay đổi thực sự không
     */
    private hasRealChanges(currentData: any, updateData: any): boolean {
        for (const key in updateData) {
            if (updateData[key] !== (currentData[key] ?? null)) {
                return true
            }
        }
        return false
    }
}
