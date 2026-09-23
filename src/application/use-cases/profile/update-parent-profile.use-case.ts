// src/application/use-cases/profile/update-parent-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { UpdateUserData } from '../../../domain/repositories/user.repository'
import { ParentResponseDto, UpdateParentDto, BaseResponseDto } from '../../dtos'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
  ForbiddenException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateParentProfileUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(userId: number, dto: UpdateParentDto): Promise<BaseResponseDto<ParentResponseDto>> {
    // Tự đổi username/mật khẩu/trạng thái xác thực email là thao tác không cho phép qua endpoint tự cập nhật hồ sơ
    if (dto.username !== undefined) {
      throw new ForbiddenException('Không thể tự thay đổi tên đăng nhập')
    }
    if (dto.password !== undefined) {
      throw new ForbiddenException('Không thể tự đặt mật khẩu qua endpoint này')
    }
    if (dto.isEmailVerified !== undefined) {
      throw new ForbiddenException('Không thể tự thay đổi trạng thái xác thực email')
    }

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const parent = await repos.parentRepository.findByUserId(userId, { includeUser: true })
      if (!parent?.user) {
        throw new NotFoundException('Không tìm thấy hồ sơ phụ huynh')
      }

      if (!parent.user.isActive) {
        throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
      }

      await this.validateUniqueConstraints(repos, parent.user.userId, dto)

      const userUpdateData: UpdateUserData = {}
      if (dto.email !== undefined) userUpdateData.email = dto.email
      if (dto.firstName !== undefined) userUpdateData.firstName = dto.firstName
      if (dto.lastName !== undefined) userUpdateData.lastName = dto.lastName
      if (dto.gender !== undefined) userUpdateData.gender = dto.gender
      if (dto.dateOfBirth !== undefined) userUpdateData.dateOfBirth = dto.dateOfBirth

      const hasChanges = this.hasRealChanges(parent.user, userUpdateData)
      if (!hasChanges) {
        return BaseResponseDto.success('No changes detected', ParentResponseDto.fromParent(parent))
      }

      if ('email' in userUpdateData && userUpdateData.email !== (parent.user.email ?? null)) {
        if (parent.user.isEmailVerified) {
          userUpdateData.isEmailVerified = false
        }
      }

      await repos.userRepository.update(parent.user.userId, userUpdateData)

      const updatedParent = await repos.parentRepository.findByUserId(userId, {
        includeUser: true,
        includeStudents: true,
      })
      if (!updatedParent) {
        throw new BusinessLogicException('Unable to retrieve parent profile after update')
      }

      return BaseResponseDto.success('Cập nhật hồ sơ phụ huynh thành công', ParentResponseDto.fromParent(updatedParent))
    })
  }

  private async validateUniqueConstraints(
    repos: UnitOfWorkRepos,
    currentUserId: number,
    dto: UpdateParentDto,
  ): Promise<void> {
    if (dto.email) {
      const existingUser = await repos.userRepository.findByEmail(dto.email)
      if (existingUser && existingUser.userId !== currentUserId) {
        throw new ConflictException(`Email '${dto.email}' is already in use`)
      }
    }
  }

  private hasRealChanges(currentData: any, updateData: any): boolean {
    for (const key in updateData) {
      if (updateData[key] !== (currentData[key] ?? null)) {
        return true
      }
    }
    return false
  }
}
