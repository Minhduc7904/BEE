import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, RoleResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IRoleRepository } from '../../../domain/repositories'

@Injectable()
export class GetRoleUseCase {
  constructor(@Inject('IRoleRepository') private readonly roleRepository: IRoleRepository) {}

  async execute(roleId: number): Promise<BaseResponseDto<RoleResponseDto>> {
    const role = await this.roleRepository.findByIdWithPermissions(roleId)

    if (!role) {
      throw new NotFoundException('Role not found')
    }

    const response: RoleResponseDto = {
      roleId: role.roleId,
      roleName: role.roleName,
      description: role.description,
      isAssignable: role.isAssignable,
      createdAt: role.createdAt,
      permissions: role.permissions,
      permissionsCount: role.permissions.length,
    }

    return BaseResponseDto.success('Get role successfully', response)
  }
}
