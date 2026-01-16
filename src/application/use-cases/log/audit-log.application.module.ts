import { Module } from '@nestjs/common'

import * as auditLogUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const AUDIT_LOG_USE_CASES = [
  auditLogUseCase.RollbackUseCase,
  auditLogUseCase.GetAuditLogUseCase,
  auditLogUseCase.GetAllAuditLogsUseCase,
  auditLogUseCase.GetAuditLogsByAdminUseCase,
  auditLogUseCase.GetAuditLogsByResourceUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: AUDIT_LOG_USE_CASES,
  exports: AUDIT_LOG_USE_CASES,
})
export class AuditLogApplicationModule {}
