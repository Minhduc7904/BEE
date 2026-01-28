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

    Object.defineProperty(repos, 'permissionRepository', {
      get: () => new Repositories.PrismaPermissionRepository(client),
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
    let _mediaRepository: any
    let _subjectRepository: any
    let _chapterRepository: any
    let _attendanceRepository: any
    let _classSessionRepository: any
    let _classStudentRepository: any
    let _courseRepository: any
    let _courseClassRepository: any
    let _courseEnrollmentRepository: any
    let _learningItemRepository: any
    let _lessonLearningItemRepository: any
    let _documentContentRepository: any
    let _homeworkContentRepository: any
    let _homeworkSubmitRepository: any
    let _videoContentRepository: any
    let _youtubeContentRepository: any
    let _notificationRepository: any
    let _tuitionPaymentRepository: any

    Object.defineProperty(repos, 'studentRepository', {
      get: () => (_studentRepository ??= new Repositories.PrismaStudentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'userRefreshTokenRepository', {
      get: () => (_userRefreshTokenRepository ??= new Repositories.PrismaUserRefreshTokenRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'mediaRepository', {
      get: () => (_mediaRepository ??= new Repositories.PrismaMediaRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'subjectRepository', {
      get: () => (_subjectRepository ??= new Repositories.PrismaSubjectRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'chapterRepository', {
      get: () => (_chapterRepository ??= new Repositories.PrismaChapterRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'attendanceRepository', {
      get: () => (_attendanceRepository ??= new Repositories.PrismaAttendanceRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'classSessionRepository', {
      get: () => (_classSessionRepository ??= new Repositories.PrismaClassSessionRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'classStudentRepository', {
      get: () => (_classStudentRepository ??= new Repositories.PrismaClassStudentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'courseRepository', {
      get: () => (_courseRepository ??= new Repositories.PrismaCourseRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'courseClassRepository', {
      get: () => (_courseClassRepository ??= new Repositories.PrismaCourseClassRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'courseEnrollmentRepository', {
      get: () => (_courseEnrollmentRepository ??= new Repositories.PrismaCourseEnrollmentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'learningItemRepository', {
      get: () => (_learningItemRepository ??= new Repositories.PrismaLearningItemRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'lessonLearningItemRepository', {
      get: () => (_lessonLearningItemRepository ??= new Repositories.PrismaLessonLearningItemRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'documentContentRepository', {
      get: () => (_documentContentRepository ??= new Repositories.PrismaDocumentContentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'homeworkContentRepository', {
      get: () => (_homeworkContentRepository ??= new Repositories.PrismaHomeworkContentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'homeworkSubmitRepository', {
      get: () => (_homeworkSubmitRepository ??= new Repositories.PrismaHomeworkSubmitRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'videoContentRepository', {
      get: () => (_videoContentRepository ??= new Repositories.PrismaVideoContentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'youtubeContentRepository', {
      get: () => (_youtubeContentRepository ??= new Repositories.PrismaYoutubeContentRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'notificationRepository', {
      get: () => (_notificationRepository ??= new Repositories.PrismaNotificationRepository(client)),
      enumerable: true,
    })

    Object.defineProperty(repos, 'tuitionPaymentRepository', {
      get: () => (_tuitionPaymentRepository ??= new Repositories.PrismaTuitionPaymentRepository(client)),
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
