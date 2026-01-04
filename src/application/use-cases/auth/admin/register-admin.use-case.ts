// src/application/use-cases/register-admin.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../../domain/repositories'
import {
  RegisterAdminResponseDto,
  AdminResponseDto,
  RegisterAdminDto
} from '../../../dtos'
import { ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import { PasswordService } from '../../../../infrastructure/services'
import { ACTION_KEYS } from 'src/shared/constants'
import { AuditStatus } from 'src/shared/enums'

@Injectable()
export class RegisterAdminUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
  ) { }

  async execute(dto: RegisterAdminDto, adminId: number): Promise<RegisterAdminResponseDto> {
    return this.unitOfWork.executeInTransaction(async (repos) => {
      // Validate unique constraints
      const usernameExists = await repos.userRepository.existsByUsername(dto.username)
      if (usernameExists) {
        throw new ConflictException('Username đã tồn tại')
      }

      if (dto.email) {
        const emailExists = await repos.userRepository.existsByEmail(dto.email)
        if (emailExists) {
          throw new ConflictException('Email đã tồn tại')
        }
      }

      const roleIds = (dto.roleIds ?? [])
        .map(Number)
        .filter(id => Number.isInteger(id) && id > 1);

      const existsRoleIds = await repos.roleRepository.findIdsByIds(roleIds);
      if (existsRoleIds.length !== roleIds.length) {
        throw new ConflictException('Một hoặc nhiều vai trò không tồn tại')
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(dto.password)

      // Create user (trong transaction)
      const user = await repos.userRepository.create({
        username: dto.username,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: true,
        isEmailVerified: false,
      })

      // Gán vai trò cho user (nếu có)
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await repos.roleRepository.assignRoleToUser(user.userId, roleId);
        }
      }

      // Create admin (trong cùng transaction)
      const admin = await repos.adminRepository.create({
        userId: user.userId,
        subjectId: dto.subjectId,
      })

      // Log the creation action with the adminId who performed it
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.ADMIN.CREATE,
        status: AuditStatus.SUCCESS,
        resourceType: 'Admin',
        resourceId: admin.adminId.toString(),
        afterData: { user, admin },
      })

      return {
        success: true,
        message: 'Đăng ký admin thành công',
        data: AdminResponseDto.fromUserWithAdmin(user, admin),
      }
    })
  }
}
