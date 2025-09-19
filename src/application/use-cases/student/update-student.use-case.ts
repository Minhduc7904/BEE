// src/application/use-cases/student/update-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { StudentResponseDto, UpdateStudentDto } from '../../dtos/student/student.dto'
import { UpdateUserDto } from '../../dtos/user/user.dto'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
} from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from 'src/application/dtos'

@Injectable()
export class UpdateStudentUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) { }

  async execute(studentId: number, dto: UpdateStudentDto): Promise<BaseResponseDto<StudentResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Tìm student với thông tin user
      const student = await repos.studentRepository.findById(studentId)
      if (!student) {
        throw new NotFoundException(`Student với ID ${studentId} không tồn tại`)
      }

      if (!student.user) {
        throw new BusinessLogicException('Thông tin user của student không tồn tại')
      }

      // 2. Kiểm tra unique constraints trước khi cập nhật
      await this.validateUniqueConstraints(repos, student.user.userId, dto)

      // 3. Tách data cho User và Student
      const userUpdateData: UpdateUserDto = {}
      const studentUpdateData: Partial<UpdateStudentDto> = {}

      // Tách các trường của User
      if (dto.username !== undefined) userUpdateData.username = dto.username
      if (dto.email !== undefined) userUpdateData.email = dto.email
      if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName
      if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName

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
        return StudentResponseDto.fromStudentEntity(student)
      }

      // 5. Kiểm tra và reset email verification nếu email thay đổi
      if (userUpdateData.email && userUpdateData.email !== student.user.email) {
        // Nếu email cũ đã được verify và email mới khác email cũ
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
        await repos.studentRepository.update(studentId, studentUpdateData)
      }

      // 8. Lấy lại student đã cập nhật với thông tin user mới
      const updatedStudent = await repos.studentRepository.findById(studentId)
      if (!updatedStudent) {
        throw new BusinessLogicException('Không thể lấy thông tin student sau khi cập nhật')
      }

      return StudentResponseDto.fromStudentEntity(updatedStudent)
    })

    return BaseResponseDto.success(
      'Cập nhật thông tin student thành công',
      result,
    )
  }

  /**
   * Validate unique constraints cho username và email
   */
  private async validateUniqueConstraints(repos: any, currentUserId: number, dto: UpdateStudentDto): Promise<void> {
    // Kiểm tra username unique
    if (dto.username) {
      const existingUser = await repos.userRepository.findByUsername(dto.username)
      if (existingUser && existingUser.userId !== currentUserId) {
        throw new ConflictException(`Username '${dto.username}' đã được sử dụng bởi user khác`)
      }
    }

    // Kiểm tra email unique
    if (dto.email) {
      const existingUser = await repos.userRepository.findByEmail(dto.email)
      if (existingUser && existingUser.userId !== currentUserId) {
        throw new ConflictException(`Email '${dto.email}' đã được sử dụng bởi user khác`)
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
