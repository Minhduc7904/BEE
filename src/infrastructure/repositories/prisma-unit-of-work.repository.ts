// src/infrastructure/repositories/prisma-unit-of-work.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUnitOfWork, UnitOfWorkRepos } from '../../domain/repositories/unit-of-work.repository';
import { Prisma } from '@prisma/client';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaAdminRepository } from './prisma-admin.repository';
import { PrismaStudentRepository } from './prisma-student.repository';
import { PrismaUserRefreshTokenRepository } from './prisma-user-refresh-token.repository';
import { PrismaDocumentRepository } from './prisma-document.repository';
import { PrismaQuestionImageRepository } from './prisma-question-image.repository';
import { PrismaSolutionImageRepository } from './prisma-solution-image.repository';
import { PrismaMediaImageRepository } from './prisma-media-image.repository';
import { PrismaImageRepository } from './prisma-image.repository';
import { DomainMapper } from '../mappers/domain-mapper';

type Prismaish = Prisma.TransactionClient | PrismaService; // chỉ cần các delegate CRUD

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    private buildRepos(client: Prismaish): UnitOfWorkRepos {
        return {
            userRepository: new PrismaUserRepository(client),
            adminRepository: new PrismaAdminRepository(client),
            studentRepository: new PrismaStudentRepository(client),
            userRefreshTokenRepository: new PrismaUserRefreshTokenRepository(client),
            documentRepository: new PrismaDocumentRepository(client),
            questionImageRepository: new PrismaQuestionImageRepository(client),
            solutionImageRepository: new PrismaSolutionImageRepository(client),
            mediaImageRepository: new PrismaMediaImageRepository(client),
            imageRepository: new PrismaImageRepository(client),
        };
    }

    async executeInTransaction<T>(
        work: (repos: UnitOfWorkRepos) => Promise<T>,
        options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
    ): Promise<T> {
        return this.prisma.$transaction(
            async (tx) => {
                const repos = this.buildRepos(tx);
                return work(repos);
            },
            options ? { isolationLevel: options.isolationLevel } : undefined
        );
    }

    // Những hàm này không cần dùng với Prisma; giữ để tương thích interface cũ (no-op)
    async beginTransaction(): Promise<void> { /* no-op */ }
    async commitTransaction(): Promise<void> { /* no-op */ }
    async rollbackTransaction(): Promise<void> { /* no-op */ }
}