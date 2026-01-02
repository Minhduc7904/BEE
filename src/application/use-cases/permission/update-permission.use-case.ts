import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, UpdatePermissionDto, PermissionResponseDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdatePermissionUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    permissionId: number,
    dto: UpdatePermissionDto,
    adminId: number,
  ): Promise<BaseResponseDto<PermissionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const permissionRepository = repos.permissionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra permission có tồn tại không
      const existingPermission = await permissionRepository.findById(permissionId)
      if (!existingPermission) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.PERMISSION.UPDATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.PERMISSION,
          resourceId: permissionId.toString(),
          errorMessage: 'Permission not found',
        })
        throw new NotFoundException('Permission not found')
      }

      // Nếu update code, kiểm tra code mới có bị trùng không
      if (dto.code && dto.code !== existingPermission.code) {
        const permissionWithSameCode = await permissionRepository.findByCode(dto.code)
        if (permissionWithSameCode) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.PERMISSION.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.PERMISSION,
            resourceId: permissionId.toString(),
            errorMessage: `Permission với code '${dto.code}' đã tồn tại`,
          })
          throw new ConflictException(`Permission với code '${dto.code}' đã tồn tại`)
        }
      }

      // Update permission
      const updatedPermission = await permissionRepository.update(permissionId, {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        group: dto.group,
        isSystem: dto.isSystem,
      })

      const response = PermissionResponseDto.fromPermission(updatedPermission)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.PERMISSION.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.PERMISSION,
        resourceId: permissionId.toString(),
        beforeData: {
          code: existingPermission.code,
          name: existingPermission.name,
          group: existingPermission.group,
        },
        afterData: {
          code: updatedPermission.code,
          name: updatedPermission.name,
          group: updatedPermission.group,
        },
      })

      return response
    })

    return BaseResponseDto.success('Update permission successfully', result)
  }
}
