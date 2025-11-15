// src/domain/repositories/unit-of-work.repository.ts
import { IUserRepository } from './user.repository'
import { IAdminRepository } from './admin.repository'
import { IStudentRepository } from './student.repository'
import { IUserRefreshTokenRepository } from './user-refresh-token.repository'
import { IRoleRepository } from './role.repository'
import { IAdminAuditLogRepository } from './admin-audit-log.repository'
import { IMediaRepository } from './media.repository'

// src/domain/repositories/unit-of-work.repository.ts
export interface UnitOfWorkRepos {
  userRepository: IUserRepository
  adminRepository: IAdminRepository
  studentRepository: IStudentRepository
  userRefreshTokenRepository: IUserRefreshTokenRepository
  roleRepository: IRoleRepository
  adminAuditLogRepository: IAdminAuditLogRepository
  mediaRepository: IMediaRepository
}

export interface IUnitOfWork {
  executeInTransaction<T>(
    work: (repos: UnitOfWorkRepos) => Promise<T>,
    options?: { isolationLevel?: import('@prisma/client').Prisma.TransactionIsolationLevel },
  ): Promise<T>
}
