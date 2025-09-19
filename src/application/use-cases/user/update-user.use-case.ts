// src/application/use-cases/user/update-user.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { UserResponseDto, UpdateUserDto } from '../../dtos/user/user.dto'
import {
  NotFoundException,
  ConflictException,
  BusinessLogicException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateUserUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(userId: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      // 1. Tìm user
      const user = await repos.userRepository.findById(userId)
      if (!user) {
        throw new NotFoundException(`User với ID ${userId} không tồn tại`)
      }

      // 2. Kiểm tra unique constraints trước khi cập nhật
      await this.validateUniqueConstraints(repos, userId, dto)

      // 3. Kiểm tra xem có thay đổi thực sự không
      const hasRealChanges = this.hasRealChanges(user, dto)
      if (!hasRealChanges) {
        // Không có thay đổi gì, trả về user hiện tại
        return UserResponseDto.fromUser(user)
      }

      // 4. Cập nhật user
      await repos.userRepository.update(userId, dto)

      // 5. Lấy lại user đã cập nhật
      const updatedUser = await repos.userRepository.findById(userId)
      if (!updatedUser) {
        throw new BusinessLogicException('Không thể lấy thông tin user sau khi cập nhật')
      }

      return UserResponseDto.fromUser(updatedUser)
    })
  }

  /**
   * Validate unique constraints cho username và email
   */
  private async validateUniqueConstraints(repos: any, currentUserId: number, dto: UpdateUserDto): Promise<void> {
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
