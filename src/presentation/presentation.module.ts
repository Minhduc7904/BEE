// src/presentation/presentation.module.ts
import { Module } from '@nestjs/common'
import { ApplicationModule } from '../application/application.module'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'
import { AuthController } from './controllers/auth.controller'
import { ResourceController } from './controllers/resource.controller'
import { RoleController } from './controllers/role.controller'
import { GoogleAuthAdminController } from './controllers/google-auth-admin.controller'
import { GoogleAuthStudentController } from './controllers/google-auth-student.controller'
import { SharedModule } from '../shared/shared.module'
import { AdminAuditLogController } from './controllers/admin-audit-log.controller'
import { StudentController } from './controllers/student.controller'
import { UserController } from './controllers/user.controller'
import { EmailVerificationController } from './controllers/email-verification.controller'

@Module({
  imports: [ApplicationModule, InfrastructureModule, SharedModule],
  controllers: [
    AuthController,
    ResourceController,
    RoleController,
    AdminAuditLogController,
    StudentController,
    UserController,
    GoogleAuthAdminController,
    GoogleAuthStudentController,
    EmailVerificationController,
  ],
})
export class PresentationModule {}
