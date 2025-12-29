// src/application/use-cases/admin/get-admin-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IAdminRepository } from '../../../domain/repositories'
import { AdminResponseDto, BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetAdminProfileUseCase {
  constructor(
    @Inject('IAdminRepository') private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(userId: number): Promise<BaseResponseDto<AdminResponseDto>> {
    // Tìm admin theo userId
    const admin = await this.adminRepository.findByUserId(userId)
    
    if (!admin) {
      throw new NotFoundException('Admin profile not found')
    }

    // Load avatar từ Media nếu có
    if (admin.user && admin.user.avatarId) {
      // Nếu cần load avatar, có thể inject thêm IMediaRepository
      // hoặc sử dụng method có sẵn từ adminRepository nếu có
    }

    return BaseResponseDto.success(
      'Get admin profile successfully',
      AdminResponseDto.fromUserWithAdmin(admin.user, admin),
    )
  }
}
