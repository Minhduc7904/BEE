import { Module } from '@nestjs/common'

import * as permissionUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const PERMISSION_USE_CASES = [
  permissionUseCase.CreatePermissionUseCase,
  permissionUseCase.GetPermissionUseCase,
  permissionUseCase.GetAllPermissionsUseCase,
  permissionUseCase.GetPermissionGroupsUseCase,
  permissionUseCase.UpdatePermissionUseCase,
  permissionUseCase.DeletePermissionUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: PERMISSION_USE_CASES,
  exports: PERMISSION_USE_CASES,
})
export class PermissionApplicationModule {}
