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
    // Tìm admin theo userId với đầy đủ thông tin user, roles và permissions
    const admin = await this.adminRepository.findByUserId(userId)
    
    if (!admin) {
      throw new NotFoundException('Admin profile not found')
    }

    // Mapper sẽ tự động xử lý việc lọc roles active và chưa expire
    // cũng như map permissions cho từng role
    const adminResponse = AdminResponseDto.fromUserWithAdmin(admin.user, admin)

    return BaseResponseDto.success(
      'Get admin profile successfully',
      adminResponse,
    )
  }
}
