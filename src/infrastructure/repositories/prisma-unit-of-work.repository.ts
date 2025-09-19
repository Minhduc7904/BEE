// src/infrastructure/repositories/prisma-unit-of-work.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { IUnitOfWork, UnitOfWorkRepos } from '../../domain/repositories/unit-of-work.repository'
import { Prisma } from '@prisma/client'
import { PrismaUserRepository } from './prisma-user.repository'
import { PrismaAdminRepository } from './prisma-admin.repository'
import { PrismaStudentRepository } from './prisma-student.repository'
import { PrismaUserRefreshTokenRepository } from './prisma-user-refresh-token.repository'
import { PrismaDocumentRepository } from './prisma-document.repository'
import { PrismaQuestionImageRepository } from './prisma-question-image.repository'
import { PrismaSolutionImageRepository } from './prisma-solution-image.repository'
import { PrismaMediaImageRepository } from './prisma-media-image.repository'
import { PrismaImageRepository } from './prisma-image.repository'
import { PrismaRoleRepository } from './prisma-role.repository'
import { PrismaAdminLogRepository } from './prisma-admin-log.repository'

type Prismaish = Prisma.TransactionClient | PrismaService // chỉ cần các delegate CRUD

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  private buildRepos(client: Prismaish): UnitOfWorkRepos {
    // Simple factory pattern - balance giữa performance và simplicity
    const repos = {} as UnitOfWorkRepos

    // Chỉ expose các repositories thường dùng nhất
    Object.defineProperty(repos, 'userRepository', {
      get: () => new PrismaUserRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'adminRepository', {
      get: () => new PrismaAdminRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'roleRepository', {
      get: () => new PrismaRoleRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'adminAuditLogRepository', {
      get: () => new PrismaAdminLogRepository(client),
      enumerable: true,
    })

    // Các repositories ít dùng - lazy load với cache
    let _studentRepository: any
    let _documentRepository: any
    let _userRefreshTokenRepository: any

    Object.defineProperty(repos, 'studentRepository', {
      get: () => (_studentRepository ??= new PrismaStudentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'documentRepository', {
      get: () => (_documentRepository ??= new PrismaDocumentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'userRefreshTokenRepository', {
      get: () => (_userRefreshTokenRepository ??= new PrismaUserRefreshTokenRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'questionImageRepository', {
      get: () => new PrismaQuestionImageRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'solutionImageRepository', {
      get: () => new PrismaSolutionImageRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'mediaImageRepository', {
      get: () => new PrismaMediaImageRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'imageRepository', {
      get: () => new PrismaImageRepository(client),
      enumerable: true,
    })

    return repos
  }

  async executeInTransaction<T>(
    work: (repos: UnitOfWorkRepos) => Promise<T>,
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        const repos = this.buildRepos(tx)
        return work(repos)
      },
      {
        maxWait: 10000, // 10 seconds to wait for a transaction slot
        timeout: 30000, // 30 seconds transaction timeout
        isolationLevel: options?.isolationLevel,
      },
    )
  }

  // Những hàm này không cần dùng với Prisma; giữ để tương thích interface cũ (no-op)
  async beginTransaction(): Promise<void> {
    /* no-op */
  }
  async commitTransaction(): Promise<void> {
    /* no-op */
  }
  async rollbackTransaction(): Promise<void> {
    /* no-op */
  }
}
