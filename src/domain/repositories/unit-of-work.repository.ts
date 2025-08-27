// src/domain/repositories/unit-of-work.repository.ts
import { IUserRepository } from './user.repository';
import { IAdminRepository } from './admin.repository';
import { IStudentRepository } from './student.repository';
import { IUserRefreshTokenRepository } from './user-refresh-token.repository';

// src/domain/repositories/unit-of-work.repository.ts
export interface UnitOfWorkRepos {
    userRepository: IUserRepository;
    adminRepository: IAdminRepository;
    studentRepository: IStudentRepository;
    userRefreshTokenRepository: IUserRefreshTokenRepository;
}

export interface IUnitOfWork {
    executeInTransaction<T>(
        work: (repos: UnitOfWorkRepos) => Promise<T>,
        options?: { isolationLevel?: import('@prisma/client').Prisma.TransactionIsolationLevel }
    ): Promise<T>;
}
