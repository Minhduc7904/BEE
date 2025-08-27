// src/domain/repositories/unit-of-work.repository.ts
import { IUserRepository } from './user.repository';
import { IAdminRepository } from './admin.repository';
import { IStudentRepository } from './student.repository';
import { IUserRefreshTokenRepository } from './user-refresh-token.repository';

export interface IUnitOfWork {
    userRepository: IUserRepository;
    adminRepository: IAdminRepository;
    studentRepository: IStudentRepository;
    userRefreshTokenRepository: IUserRefreshTokenRepository;
    
    // Transaction methods
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    
    // Execute trong transaction
    executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}