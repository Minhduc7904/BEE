// src/infrastructure/repositories/prisma-unit-of-work.repository.ts
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import {
  IUnitOfWork,
  UnitOfWorkRepos,
} from '../../domain/repositories/unit-of-work.repository'

import * as Repositories from '../repositories'

type Prismaish = Prisma.TransactionClient | PrismaService // chỉ cần các delegate CRUD

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaService) { }

  private buildRepos(client: Prismaish): UnitOfWorkRepos {
    // Simple factory pattern - balance giữa performance và simplicity
    const repos = {} as UnitOfWorkRepos

    // Chỉ expose các repositories thường dùng nhất
    Object.defineProperty(repos, 'userRepository', {
      get: () => new Repositories.PrismaUserRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'adminRepository', {
      get: () => new Repositories.PrismaAdminRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'roleRepository', {
      get: () => new Repositories.PrismaRoleRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'adminAuditLogRepository', {
      get: () => new Repositories.PrismaAdminLogRepository(client),
      enumerable: true,
    })

    // Các repositories ít dùng - lazy load với cache
    let _studentRepository: any
    let _documentRepository: any
    let _userRefreshTokenRepository: any

    Object.defineProperty(repos, 'studentRepository', {
      get: () => (_studentRepository ??= new Repositories.PrismaStudentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'documentRepository', {
      get: () => (_documentRepository ??= new Repositories.PrismaDocumentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'userRefreshTokenRepository', {
      get: () => (_userRefreshTokenRepository ??= new Repositories.PrismaUserRefreshTokenRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'questionImageRepository', {
      get: () => new Repositories.PrismaQuestionImageRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'solutionImageRepository', {
      get: () => new Repositories.PrismaSolutionImageRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'mediaImageRepository', {
      get: () => new Repositories.PrismaMediaImageRepository(client),
      enumerable: true,
    })

    Object.defineProperty(repos, 'imageRepository', {
      get: () => new Repositories.PrismaImageRepository(client),
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
