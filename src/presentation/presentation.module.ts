// src/presentation/presentation.module.ts
import { Module } from '@nestjs/common'
import { ApplicationModule } from '../application/application.module'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'
import { AuthController } from './controllers/auth.controller'
import { RoleController } from './controllers/role.controller'
import { GoogleAuthAdminController } from './controllers/google-auth-admin.controller'
import { GoogleAuthStudentController } from './controllers/google-auth-student.controller'
import { SharedModule } from '../shared/shared.module'
import { AdminAuditLogController } from './controllers/admin-audit-log.controller'
import { StudentController } from './controllers/student.controller'
import { UserController } from './controllers/user.controller'
import { EmailVerificationController } from './controllers/email-verification.controller'
import { EmailResetPasswordController} from './controllers/email-reset-password.controller'
import { MediaController } from './controllers/media.controller'
import { MediaUsageController } from './controllers/media-usage.controller'
import { MediaFolderController } from './controllers/media-folder.controller'
import { ProfileAdminController } from './controllers/profile.admin.controller'
import { PermissionController } from './controllers/permission.controller'
import { AdminController } from './controllers/admin.controller'
@Module({
  imports: [ApplicationModule, InfrastructureModule, SharedModule],
  controllers: [
    AuthController,
    RoleController,
    AdminAuditLogController,
    StudentController,
    UserController,
    GoogleAuthAdminController,
    GoogleAuthStudentController,
    EmailVerificationController,
    EmailResetPasswordController,
    MediaController,
    MediaUsageController,
    MediaFolderController,
    ProfileAdminController,
    PermissionController,
    AdminController,
  ],
})
export class PresentationModule {}
