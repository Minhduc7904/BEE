// src/infrastructure/repositories/prisma-user.repository.ts
import { PrismaService } from '../../prisma/prisma.service';
import type { IUserRepository, CreateUserData } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user/user.entity';
import { Admin } from '../../domain/entities/user/admin.entity';
import { Student } from '../../domain/entities/user/student.entity';
import { DomainMapper } from '../mappers/domain-mapper';
import { NumberUtil } from '../../shared/utils/number.util';

export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

    async create(data: CreateUserData): Promise<User> {
        const prismaUser = await this.prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash: data.passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
            },
        });

        return DomainMapper.toDomainUser(prismaUser)!;
    }

    async findById(id: number): Promise<User | null> {
        const numericId = NumberUtil.ensureValidId(id, 'User ID');
        
        const prismaUser = await this.prisma.user.findUnique({
            where: { userId: numericId },
        });

        return DomainMapper.toDomainUser(prismaUser);
    }

    async findByUsername(username: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { username },
        });

        return DomainMapper.toDomainUser(prismaUser);
    }

    async findByUsernameWithDetails(username: string): Promise<{
        user: User;
        admin?: Admin;
        student?: Student;
    } | null> {
        const result = await this.prisma.user.findUnique({
            where: { username },
            include: {
                admin: true,
                student: true,
            },
        });

        return DomainMapper.toDomainUserWithDetails(result);
    }

    async updateLastLogin(userId: number): Promise<void> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        await this.prisma.user.update({
            where: { userId: numericUserId },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        const prismaUser = await this.prisma.user.findUnique({
            where: { email },
        });

        return DomainMapper.toDomainUser(prismaUser);
    }

    async update(id: number, data: Partial<User>): Promise<User> {
        const numericId = NumberUtil.ensureValidId(id, 'User ID');
        
        const prismaUser = await this.prisma.user.update({
            where: { userId: numericId },
            data: {
                username: data.username,
                email: data.email,
                passwordHash: data.passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                isActive: data.isActive,
            },
        });

        return DomainMapper.toDomainUser(prismaUser)!;
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'User ID');
        
        try {
            await this.prisma.user.delete({
                where: { userId: numericId },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async existsByUsername(username: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { username },
        });
        return count > 0;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email },
        });
        return count > 0;
    }
}