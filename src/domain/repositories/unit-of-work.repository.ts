// src/domain/repositories/unit-of-work.repository.ts
import { IUserRepository } from './user.repository'
import { IAdminRepository } from './admin.repository'
import { IStudentRepository } from './student.repository'
import { IUserRefreshTokenRepository } from './user-refresh-token.repository'
import { IDocumentRepository } from './document.repository'
import { IQuestionImageRepository } from './question-image.repository'
import { ISolutionImageRepository } from './solution-image.repository'
import { IMediaImageRepository } from './media-image.repository'
import { IImageRepository } from './image.repository'
import { IRoleRepository } from './role.repository'
import { IAdminAuditLogRepository } from './admin-audit-log.repository'

// src/domain/repositories/unit-of-work.repository.ts
export interface UnitOfWorkRepos {
  userRepository: IUserRepository
  adminRepository: IAdminRepository
  studentRepository: IStudentRepository
  userRefreshTokenRepository: IUserRefreshTokenRepository
  documentRepository: IDocumentRepository
  questionImageRepository: IQuestionImageRepository
  solutionImageRepository: ISolutionImageRepository
  mediaImageRepository: IMediaImageRepository
  imageRepository: IImageRepository
  roleRepository: IRoleRepository
  adminAuditLogRepository: IAdminAuditLogRepository
}

export interface IUnitOfWork {
  executeInTransaction<T>(
    work: (repos: UnitOfWorkRepos) => Promise<T>,
    options?: { isolationLevel?: import('@prisma/client').Prisma.TransactionIsolationLevel },
  ): Promise<T>
}
