import { Module } from '@nestjs/common'

import * as roleUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const ROLE_USE_CASES = [
  roleUseCase.CreateRoleUseCase,
  roleUseCase.GetRoleUseCase,
  roleUseCase.GetAllRolesUseCase,
  roleUseCase.UpdateRoleUseCase,
  roleUseCase.DeleteRoleUseCase,
  roleUseCase.AssignRoleToUserUseCase,
  roleUseCase.GetUserRolesUseCase,
  roleUseCase.ToggleRolePermissionUseCase,
  roleUseCase.RemoveRoleFromUserUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: ROLE_USE_CASES,
  exports: ROLE_USE_CASES,
})
export class RoleApplicationModule {}
