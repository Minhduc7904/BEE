import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, RoleResponseDto } from '../../dtos'
import type { IRoleRepository } from '../../../domain/repositories'

@Injectable()
export class GetAllRolesUseCase {
  constructor(@Inject('IRoleRepository') private readonly roleRepository: IRoleRepository) {}

  async execute(limit?: number, offset?: number): Promise<BaseResponseDto<RoleResponseDto[]>> {
    const roles = await this.roleRepository.findAllWithPermissionsCount(limit, offset)

    const response: RoleResponseDto[] = roles.map((role) => ({
      roleId: role.roleId,
      roleName: role.roleName,
      description: role.description,
      isAssignable: role.isAssignable,
      createdAt: role.createdAt,
      permissionsCount: role.permissionsCount,
    }))

    return BaseResponseDto.success('Get all roles successfully', response)
  }
}
