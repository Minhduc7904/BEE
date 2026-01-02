import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, AssignUserRoleDto } from '../../dtos'
import {
  NotFoundException,
  ConflictException,
} from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class AssignRoleToUserUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) { }

  async execute(
    dto: AssignUserRoleDto,
    adminId: number,
  ): Promise<BaseResponseDto<{ message: string }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { userRepository, roleRepository, adminAuditLogRepository } = repos

      // 0️⃣ Guard adminId
      if (!adminId) {
        throw new ConflictException('Admin ID is required')
      }

      // 1️⃣ Check user
      const user = await userRepository.findById(dto.userId)
      if (!user) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.ROLE.ASSIGN,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.USER_ROLE,
          errorMessage: 'User not found',
        })
        throw new NotFoundException('User not found')
      }

      // 2️⃣ Check role
      const role = await roleRepository.findById(dto.roleId)
      if (!role) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.ROLE.ASSIGN,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.USER_ROLE,
          errorMessage: 'Role not found',
        })
        throw new NotFoundException('Role not found')
      }

      const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null
      console.log('expiresAt:', expiresAt, dto.expiresAt)
      // 3️⃣ Check user-role record tồn tại chưa
      const existingUserRole = await roleRepository.getUserRole(
        dto.userId,
        dto.roleId,
      )

      // 4️⃣ Chưa từng có → CREATE
      if (!existingUserRole) {
        await roleRepository.assignRoleToUser(
          dto.userId,
          dto.roleId,
          adminId,
          expiresAt ?? undefined,
        )

        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.ROLE.ASSIGN,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.USER_ROLE,
          afterData: {
            userId: dto.userId,
            roleId: dto.roleId,
            roleName: role.roleName,
            expiresAt,
          },
        })

        return {
          message: `Role '${role.roleName}' assigned to user successfully`,
        }
      }

      // 5️⃣ Đã từng có → UPDATE / RE-ACTIVATE
      await roleRepository.updateUserRole(dto.userId, dto.roleId, {
        isActive: true,
        expiresAt: expiresAt ?? undefined,
        assignedBy: adminId,
      })

      await adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.ROLE.UPDATE, // 👈 phân biệt ASSIGN / UPDATE
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.USER_ROLE,
        beforeData: {
          userId: dto.userId,
          roleId: dto.roleId,
          wasActive: existingUserRole.isActive,
          oldExpiresAt: existingUserRole.expiresAt,
        },
        afterData: {
          isActive: true,
          expiresAt,
        },
      })

      return {
        message: `Role '${role.roleName}' updated for user successfully`,
      }
    })

    return BaseResponseDto.success('Assign role successfully', result)
  }
}
