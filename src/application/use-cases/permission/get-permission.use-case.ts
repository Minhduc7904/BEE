import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, PermissionResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IPermissionRepository } from '../../../domain/repositories'

@Injectable()
export class GetPermissionUseCase {
  constructor(
    @Inject('IPermissionRepository') private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(permissionId: number): Promise<BaseResponseDto<PermissionResponseDto>> {
    const permission = await this.permissionRepository.findById(permissionId)

    if (!permission) {
      throw new NotFoundException('Permission not found')
    }

    const response = PermissionResponseDto.fromPermission(permission)

    return BaseResponseDto.success('Get permission successfully', response)
  }
}
