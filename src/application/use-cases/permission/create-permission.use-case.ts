import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, CreatePermissionDto, PermissionResponseDto } from '../../dtos'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class CreatePermissionUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: CreatePermissionDto,
    adminId: number,
  ): Promise<BaseResponseDto<PermissionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const permissionRepository = repos.permissionRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra permission code đã tồn tại chưa
      const existingPermission = await permissionRepository.findByCode(dto.code)
      if (existingPermission) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.PERMISSION.CREATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.PERMISSION,
          errorMessage: `Permission với code '${dto.code}' đã tồn tại`,
        })
        throw new ConflictException(`Permission với code '${dto.code}' đã tồn tại`)
      }

      // Tạo permission mới
      const permission = await permissionRepository.create({
        code: dto.code,
        name: dto.name,
        description: dto.description,
        group: dto.group,
        isSystem: dto.isSystem ?? false,
      })

      const response = PermissionResponseDto.fromPermission(permission)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.PERMISSION.CREATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.PERMISSION,
        resourceId: permission.permissionId.toString(),
        afterData: {
          code: permission.code,
          name: permission.name,
          group: permission.group,
        },
      })

      return response
    })

    return BaseResponseDto.success('Create permission successfully', result)
  }
}
