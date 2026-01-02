import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, AssignUserRoleDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class RemoveRoleFromUserUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: AssignUserRoleDto,
        adminId: number,
    ): Promise<BaseResponseDto<{ message: string }>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const userRepository = repos.userRepository
            const roleRepository = repos.roleRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository
            if (dto.roleId == 1) {
                throw new ConflictException('Cannot remove system role from user')
            }
            // 1️⃣ Check user exists
            const user = await userRepository.findById(dto.userId)
            if (!user) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.ROLE.REMOVE,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.USER_ROLE,
                    errorMessage: 'User not found',
                })
                throw new NotFoundException('User not found')
            }

            // 2️⃣ Check role exists
            const role = await roleRepository.findById(dto.roleId)
            if (!role) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.ROLE.REMOVE,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.USER_ROLE,
                    errorMessage: 'Role not found',
                })
                throw new NotFoundException('Role not found')
            }

            // 3️⃣ Check user HAS this role
            const hasRole = await roleRepository.hasRole(
                dto.userId,
                dto.roleId,
            )

            if (!hasRole) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.ROLE.REMOVE,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.USER_ROLE,
                    errorMessage: 'User does not have this role',
                })
                throw new ConflictException('User does not have this role')
            }

            // 4️⃣ Remove role
            await roleRepository.removeRoleFromUser(
                dto.userId,
                dto.roleId,
                adminId,
            )

            // 5️⃣ Audit success
            await adminAuditLogRepository.create({
                adminId,
                actionKey: ACTION_KEYS.ROLE.REMOVE,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.USER_ROLE,
                beforeData: {
                    userId: dto.userId,
                    roleId: dto.roleId,
                    roleName: role.roleName,
                },
            })

            return {
                message: `Role '${role.roleName}' removed from user successfully`,
            }
        })

        return BaseResponseDto.success('Remove role successfully', result)
    }
}
