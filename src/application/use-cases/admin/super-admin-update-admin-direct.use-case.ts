import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { PasswordService } from 'src/infrastructure/services'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { AdminResponseDto } from 'src/application/dtos/admin/admin.dto'
import { UpdateAdminDirectDto } from 'src/application/dtos/admin/update-admin-direct.dto'
import { UpdateUserData } from 'src/domain/repositories/user.repository'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
} from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class SuperAdminUpdateAdminDirectUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE')
    private readonly passwordService: PasswordService,
  ) { }

  async execute(dto: UpdateAdminDirectDto): Promise<BaseResponseDto<AdminResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const admin = await repos.adminRepository.findById(dto.adminId)
      if (!admin) {
        throw new NotFoundException(`Admin với ID ${dto.adminId} không tồn tại`)
      }

      if (!admin.user) {
        throw new BusinessLogicException('Thông tin user của admin không tồn tại')
      }

      await this.validateUniqueConstraints(repos, admin.user.userId, dto)

      const userUpdateData: UpdateUserData = {}
      const adminUpdateData: { subjectId?: number | null; adminZaloOaId?: string | null } = {}

      if (dto.username !== undefined) userUpdateData.username = dto.username
      if (dto.email !== undefined) userUpdateData.email = dto.email
      if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName
      if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName
      if (dto.gender !== undefined) userUpdateData.gender = dto.gender
      if (dto.dateOfBirth !== undefined) {
        userUpdateData.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined
      }
      if (dto.isEmailVerified !== undefined) userUpdateData.isEmailVerified = dto.isEmailVerified
      if (dto.isActive !== undefined) userUpdateData.isActive = dto.isActive
      if (dto.password) {
        userUpdateData.passwordHash = await this.passwordService.hashPassword(dto.password)
      }

      if (dto.subjectId !== undefined) adminUpdateData.subjectId = dto.subjectId
      if (dto.adminZaloOaId !== undefined) adminUpdateData.adminZaloOaId = dto.adminZaloOaId

      const hasUserChanges = this.hasRealChanges(admin.user, userUpdateData)
      const hasAdminChanges = this.hasRealChanges(admin, adminUpdateData)

      if (!hasUserChanges && !hasAdminChanges) {
        return AdminResponseDto.fromUserWithAdmin(admin.user, admin)
      }

      if (hasUserChanges) {
        await repos.userRepository.update(admin.user.userId, userUpdateData)
      }

      if (hasAdminChanges) {
        await repos.adminRepository.update(dto.adminId, adminUpdateData)
      }

      const updatedAdmin = await repos.adminRepository.findById(dto.adminId)
      if (!updatedAdmin) {
        throw new BusinessLogicException('Không thể lấy thông tin admin sau khi cập nhật')
      }

      return AdminResponseDto.fromUserWithAdmin(updatedAdmin.user, updatedAdmin)
    })

    return BaseResponseDto.success('Cập nhật thông tin admin thành công', result)
  }

  private async validateUniqueConstraints(repos: any, currentUserId: number, dto: UpdateAdminDirectDto): Promise<void> {
    if (dto.username) {
      const existingUser = await repos.userRepository.findByUsername(dto.username)
      if (existingUser && existingUser.userId !== currentUserId) {
        throw new ConflictException(`Username '${dto.username}' đã được sử dụng bởi user khác`)
      }
    }

    if (dto.email) {
      const existingUser = await repos.userRepository.findByEmail(dto.email)
      if (existingUser && existingUser.userId !== currentUserId) {
        throw new ConflictException(`Email '${dto.email}' đã được sử dụng bởi user khác`)
      }
    }

    if (dto.subjectId !== undefined) {
      const subject = await repos.subjectRepository.findById(dto.subjectId)
      if (!subject) {
        throw new NotFoundException(`Môn học với ID ${dto.subjectId} không tồn tại`)
      }
    }
  }

  private hasRealChanges(currentData: any, updateData: any): boolean {
    for (const key in updateData) {
      if (updateData[key] !== undefined && updateData[key] !== currentData[key]) {
        return true
      }
    }
    return false
  }
}
