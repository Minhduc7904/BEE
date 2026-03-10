// src/application/use-cases/admin/update-admin-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { AdminResponseDto, UpdateAdminDto, UpdateUserDto, BaseResponseDto } from '../../dtos'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
  ForbiddenException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateAdminProfileUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    userId: number,
    dto: UpdateAdminDto,
  ): Promise<BaseResponseDto<AdminResponseDto>> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Tìm admin theo userId
      const admin = await repos.adminRepository.findByUserId(userId)
      if (!admin) {
        throw new NotFoundException('Admin profile not found')
      }

      if (!admin.user) {
        throw new BusinessLogicException('Admin user information not found')
      }

      if (!admin.user.isActive) {
        throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
      }

      // 2. Kiểm tra unique constraints trước khi cập nhật
      await this.validateUniqueConstraints(repos, admin.user.userId, dto)

      // 3. Tách data cho User và Admin
      const userUpdateData: UpdateUserDto = {}
      const adminUpdateData: { subjectId?: number } = {}

      // Tách các trường của User
      if (dto.username !== undefined) userUpdateData.username = dto.username
      if (dto.email !== undefined) userUpdateData.email = dto.email
      if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName
      if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName
      if (dto.gender !== undefined) userUpdateData.gender = dto.gender
      if (dto.dateOfBirth !== undefined) userUpdateData.dateOfBirth = dto.dateOfBirth

      // Tách các trường của Admin
      if (dto.subjectId !== undefined) adminUpdateData.subjectId = dto.subjectId

      // 4. Kiểm tra xem có thay đổi thực sự không
      const hasUserChanges = this.hasRealChanges(admin.user, userUpdateData)
      const hasAdminChanges = this.hasRealChanges(admin, adminUpdateData)

      if (!hasUserChanges && !hasAdminChanges) {
        // Không có thay đổi gì, trả về admin hiện tại
        const response = AdminResponseDto.fromUserWithAdmin(admin.user, admin)
        return BaseResponseDto.success('No changes detected', response)
      }

      // 5. Cập nhật User nếu có thay đổi
      if (hasUserChanges) {
        await repos.userRepository.update(admin.user.userId, userUpdateData)
      }

      // 6. Cập nhật Admin nếu có thay đổi
      if (hasAdminChanges) {
        await repos.adminRepository.update(admin.adminId, adminUpdateData)
      }

      // 7. Lấy lại admin đã cập nhật với thông tin user mới
      const updatedAdmin = await repos.adminRepository.findById(admin.adminId)
      if (!updatedAdmin) {
        throw new BusinessLogicException('Unable to retrieve admin profile after update')
      }

      const response = AdminResponseDto.fromUserWithAdmin(updatedAdmin.user, updatedAdmin)
      return BaseResponseDto.success('Update admin profile successfully', response)
    })
  }

  /**
   * Validate unique constraints cho username và email
   */
  private async validateUniqueConstraints(
    repos: any,
    currentUserId: number,
    dto: UpdateAdminDto,
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

    // Kiểm tra subjectId tồn tại nếu được cung cấp
    if (dto.subjectId !== undefined) {
      const subject = await repos.subjectRepository.findById(dto.subjectId)
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`)
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
