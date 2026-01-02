import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, AdminResponseDto } from '../../dtos'
import type { IAdminRepository } from '../../../domain/repositories'
import { NotFoundException, BusinessLogicException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetAdminByIdUseCase {
  constructor(@Inject('IAdminRepository') private readonly adminRepository: IAdminRepository) {}

  async execute(adminId: number): Promise<BaseResponseDto<AdminResponseDto>> {
    const admin = await this.adminRepository.findById(adminId)

    if (!admin) {
      throw new NotFoundException(`Admin với ID ${adminId} không tồn tại`)
    }

    if (!admin.user) {
      throw new BusinessLogicException('Thông tin user của admin không tồn tại')
    }

    const response = AdminResponseDto.fromUserWithAdmin(admin.user, admin)

    return BaseResponseDto.success('Get admin profile successfully', response)
  }
}
