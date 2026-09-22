// src/application/use-cases/student/update-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories/unit-of-work.repository'
import { UpdateUserData } from '../../../domain/repositories/user.repository'
import { UpdateStudentData } from '../../../domain/interface/student/student.interface'
import { Student } from '../../../domain/entities'
import { StudentResponseDto, UpdateStudentDto } from '../../dtos/student/student.dto'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
  ForbiddenException,
} from '../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto } from 'src/application/dtos'
import { PasswordService } from 'src/application/interfaces'

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
  ) { }

  async execute(
    studentId: number,
    dto: UpdateStudentDto,
    isAdmin = false,
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    if (dto.studentType !== undefined && !isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới được thay đổi loại học sinh')
    }

    if (dto.username !== undefined && !isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới được thay đổi tên đăng nhập')
    }

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Tìm student với thông tin user
      const student = await repos.studentRepository.findById(studentId)
      if (!student) {
        throw new NotFoundException(`Student với ID ${studentId} không tồn tại`)
      }

      if (!student.user) {
        throw new BusinessLogicException('Thông tin user của student không tồn tại')
      }

      // 2. Kiểm tra unique constraints trước khi cập nhật - chỉ với trường thực sự thay đổi
      await this.validateUniqueConstraints(repos, student, dto)

      // 3. Tách data cho User và Student - chỉ đưa vào trường có mặt trong request
      const userUpdateData: UpdateUserData = {}
      const studentUpdateData: UpdateStudentData = {}

      // Tách các trường của User
      if (dto.username !== undefined) userUpdateData.username = dto.username
      if (dto.email !== undefined) userUpdateData.email = dto.email
      if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName
      if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName
      if (dto.gender !== undefined) userUpdateData.gender = dto.gender
      if (dto.dateOfBirth !== undefined) userUpdateData.dateOfBirth = dto.dateOfBirth

      // Đặt password trực tiếp (chỉ admin mới gửi trường này)
      if (dto.password !== undefined) {
        userUpdateData.passwordHash = await this.passwordService.hashPassword(dto.password)
      }

      // Tách các trường của Student
      if (dto.studentPhone !== undefined) studentUpdateData.studentPhone = dto.studentPhone
      if (dto.parentPhone !== undefined) studentUpdateData.parentPhone = dto.parentPhone
      if (dto.grade !== undefined) studentUpdateData.grade = dto.grade
      if (dto.school !== undefined) studentUpdateData.school = dto.school
      if (dto.highSchoolGraduationYear !== undefined) {
        studentUpdateData.highSchoolGraduationYear = dto.highSchoolGraduationYear
      }
      if (isAdmin && dto.studentType !== undefined) studentUpdateData.studentType = dto.studentType

      // 4. Kiểm tra xem có thay đổi thực sự không
      const hasUserChanges = this.hasRealChanges(student.user, userUpdateData)
      const hasStudentChanges = this.hasRealChanges(student, studentUpdateData)

      if (!hasUserChanges && !hasStudentChanges) {
        // Không có thay đổi gì, trả về student hiện tại
        return StudentResponseDto.fromStudentEntity(student)
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
   * Validate unique constraints - chỉ kiểm tra trường nào thực sự có trong request
   * và thực sự khác giá trị hiện tại. Không kiểm tra các trường không được gửi lên.
   */
  private async validateUniqueConstraints(
    repos: UnitOfWorkRepos,
    student: Student,
    dto: UpdateStudentDto,
  ): Promise<void> {
    const currentUser = student.user!

    // Kiểm tra username unique - chỉ khi username thực sự đổi
    if (dto.username !== undefined && dto.username !== currentUser.username) {
      const existingUser = await repos.userRepository.findByUsername(dto.username)
      if (existingUser && existingUser.userId !== currentUser.userId) {
        throw new ConflictException(`Username '${dto.username}' đã được sử dụng bởi user khác`)
      }
    }

    // Kiểm tra email unique - chỉ khi email thực sự đổi và không phải đang xóa email
    if (dto.email && dto.email !== currentUser.email) {
      const existingUser = await repos.userRepository.findByEmail(dto.email)
      if (existingUser && existingUser.userId !== currentUser.userId) {
        throw new ConflictException(`Email '${dto.email}' đã được sử dụng bởi user khác`)
      }
    }

    // Kiểm tra ràng buộc unique theo cặp (studentPhone, parentPhone) - chỉ khi 1 trong 2 trường đổi
    if (dto.studentPhone !== undefined || dto.parentPhone !== undefined) {
      const finalStudentPhone = dto.studentPhone !== undefined ? dto.studentPhone : student.studentPhone
      const finalParentPhone = dto.parentPhone !== undefined ? dto.parentPhone : student.parentPhone
      const phoneChanged =
        finalStudentPhone !== (student.studentPhone ?? null) || finalParentPhone !== (student.parentPhone ?? null)

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
