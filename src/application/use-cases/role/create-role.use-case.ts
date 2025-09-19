import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CreateRoleDto, RoleResponseDto } from 'src/application/dtos/role/role.dto'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from 'src/domain/repositories/unit-of-work.repository'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class CreateRoleUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: CreateRoleDto, adminId: number): Promise<BaseResponseDto<RoleResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const roleRepository = repos.roleRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra role name đã tồn tại chưa
      const existingRole = await roleRepository.findByName(dto.roleName)
      if (existingRole) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.ROLE.CREATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.ROLE,
          errorMessage: `Role với tên '${dto.roleName}' đã tồn tại`,
        })
        throw new ConflictException(`Role với tên '${dto.roleName}' đã tồn tại`)
      }

      // Tạo role mới
      const role = await roleRepository.create({
        roleName: dto.roleName,
        description: dto.description,
      })

      const response: RoleResponseDto = {
        roleId: role.roleId,
        roleName: role.roleName,
        description: role.description,
        isAssignable: role.isAssignable,
        requiredByRoleId: role.requiredByRoleId,
        createdAt: role.createdAt,
      }

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.ROLE.CREATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.ROLE,
        resourceId: role.roleId.toString(),
        afterData: response,
      })

      return new BaseResponseDto(true, 'Role được tạo thành công', response)
    })

    return result
  }
}
