// src/infrastructure/repositories/prisma-unit-of-work.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUnitOfWork } from '../../domain/repositories/unit-of-work.repository';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IAdminRepository } from '../../domain/repositories/admin.repository';
import { IStudentRepository } from '../../domain/repositories/student.repository';
import { IUserRefreshTokenRepository } from '../../domain/repositories/user-refresh-token.repository';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaAdminRepository } from './prisma-admin.repository';
import { PrismaStudentRepository } from './prisma-student.repository';
import { PrismaUserRefreshTokenRepository } from './prisma-user-refresh-token.repository';

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
    public userRepository: IUserRepository;
    public adminRepository: IAdminRepository;
    public studentRepository: IStudentRepository;
    public userRefreshTokenRepository: IUserRefreshTokenRepository;

    constructor(private prisma: PrismaService) {
        // Khởi tạo repositories với prisma client bình thường
        this.userRepository = new PrismaUserRepository(prisma);
        this.adminRepository = new PrismaAdminRepository(prisma);
        this.studentRepository = new PrismaStudentRepository(prisma);
        this.userRefreshTokenRepository = new PrismaUserRefreshTokenRepository(prisma);
    }

    async beginTransaction(): Promise<void> {
        // Prisma không có explicit transaction begin/commit
        // Sẽ dùng $transaction callback
    }

    async commitTransaction(): Promise<void> {
        // Auto commit trong $transaction
    }

    async rollbackTransaction(): Promise<void> {
        // Auto rollback nếu có lỗi trong $transaction
    }

    async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
        return this.prisma.$transaction(async (tx) => {
            // Tạo repositories với transaction client
            const originalUserRepo = this.userRepository;
            const originalAdminRepo = this.adminRepository;
            const originalStudentRepo = this.studentRepository;
            const originalRefreshTokenRepo = this.userRefreshTokenRepository;

            this.userRepository = new PrismaUserRepository(tx);
            this.adminRepository = new PrismaAdminRepository(tx);
            this.studentRepository = new PrismaStudentRepository(tx);
            this.userRefreshTokenRepository = new PrismaUserRefreshTokenRepository(tx);
            
            try {
                const result = await work();
                
                // Khôi phục repositories với prisma client bình thường
                this.userRepository = originalUserRepo;
                this.adminRepository = originalAdminRepo;
                this.studentRepository = originalStudentRepo;
                this.userRefreshTokenRepository = originalRefreshTokenRepo;
                
                return result;
            } catch (error) {
                // Khôi phục repositories nếu có lỗi
                this.userRepository = originalUserRepo;
                this.adminRepository = originalAdminRepo;
                this.studentRepository = originalStudentRepo;
                this.userRefreshTokenRepository = originalRefreshTokenRepo;
                throw error;
            }
        });
    }
}