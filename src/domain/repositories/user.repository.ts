// src/domain/repositories/user.repository.ts
import { User } from '../entities/user/user.entity';
import { Admin } from '../entities/user/admin.entity';
import { Student } from '../entities/user/student.entity';

export interface CreateUserData {
    username: string;
    email?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    oldUserId?: number;
    isActive?: boolean;
    isEmailVerified?: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UpdateUserData {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
}

export interface IUserRepository {
    create(data: CreateUserData): Promise<User>;
    findById(id: number): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByOldUserId(oldUserId: number): Promise<User | null>;
    findByUsernameWithDetails(username: string): Promise<{
        user: User;
        admin?: Admin;
        student?: Student;
    } | null>;
    findByEmailWithDetails(email: string): Promise<{
        user: User;
        admin?: Admin;
        student?: Student;
    } | null>;

    update(id: number, data: UpdateUserData): Promise<User>;
    delete(id: number): Promise<boolean>;
    existsByUsername(username: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
}
