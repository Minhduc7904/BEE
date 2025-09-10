// src/infrastructure/mappers/user.mapper.ts
import { User } from '../../domain/entities/user/user.entity';
import { Admin } from '../../domain/entities/user/admin.entity';
import { Student } from '../../domain/entities/user/student.entity';
import { StudentMapper } from './student.mapper';
import { AdminMapper } from './admin.mapper';

/**
 * Mapper class để convert từ Prisma User models sang Domain User entities
 */
export class UserMapper {
    /**
     * Convert Prisma User model sang Domain User entity
     */
    static toDomainUser(prismaUser: any): User | null {
        if (!prismaUser) return null;

        return new User(
            prismaUser.userId,
            prismaUser.username,
            prismaUser.passwordHash,
            prismaUser.firstName,
            prismaUser.lastName,
            prismaUser.isActive,
            prismaUser.email ?? undefined,
            prismaUser.createdAt,
            prismaUser.isEmailVerified ?? false,
            prismaUser.emailVerifiedAt ?? undefined,
            prismaUser.lastLoginAt ?? undefined,
            prismaUser.updatedAt ?? undefined,
            prismaUser.oldUserId ?? undefined
        );
    }

    /**
     * Convert array của Prisma Users sang array của Domain Users
     */
    static toDomainUsers(prismaUsers: any[]): User[] {
        return prismaUsers.map(user => this.toDomainUser(user)).filter(Boolean) as User[];
    }

    /**
     * Convert User với relations (admin/student) sang object với proper types
     */
    static toDomainUserWithDetails(result: any): {
        user: User;
        admin?: Admin;
        student?: Student;
    } | null {
        if (!result) return null;

        const user = this.toDomainUser(result);
        if (!user) return null;

        return {
            user,
            admin: AdminMapper.toDomainAdmin(result.admin),
            student: StudentMapper.toDomainStudent(result.student),
        };
    }
}
