// src/infrastructure/mappers/domain-mapper.ts
import { User } from '../../domain/entities/user.entity';
import { Admin } from '../../domain/entities/admin.entity';
import { Student } from '../../domain/entities/student.entity';
import { UserRefreshToken } from '../../domain/entities/user-refresh-token.entity';

/**
 * Mapper class để convert từ Prisma models sang Domain entities
 */
export class DomainMapper {
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
            prismaUser.createdAt
        );
    }

    /**
     * Convert Prisma Admin model sang Domain Admin entity
     */
    static toDomainAdmin(prismaAdmin: any): Admin | undefined {
        if (!prismaAdmin) return undefined;
        
        return new Admin(
            prismaAdmin.adminId,
            prismaAdmin.userId,
            prismaAdmin.subject ?? undefined
        );
    }

    /**
     * Convert Prisma Student model sang Domain Student entity
     */
    static toDomainStudent(prismaStudent: any): Student | undefined {
        if (!prismaStudent) return undefined;
        
        return new Student(
            prismaStudent.studentId,
            prismaStudent.userId,
            prismaStudent.grade,
            prismaStudent.studentPhone ?? undefined,
            prismaStudent.parentPhone ?? undefined,
            prismaStudent.school ?? undefined
        );
    }

    /**
     * Convert array của Prisma Users sang array của Domain Users
     */
    static toDomainUsers(prismaUsers: any[]): User[] {
        return prismaUsers.map(user => this.toDomainUser(user)).filter(Boolean) as User[];
    }

    /**
     * Convert array của Prisma Admins sang array của Domain Admins
     */
    static toDomainAdmins(prismaAdmins: any[]): Admin[] {
        return prismaAdmins.map(admin => this.toDomainAdmin(admin)).filter(Boolean) as Admin[];
    }

    /**
     * Convert array của Prisma Students sang array của Domain Students
     */
    static toDomainStudents(prismaStudents: any[]): Student[] {
        return prismaStudents.map(student => this.toDomainStudent(student)).filter(Boolean) as Student[];
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
            admin: this.toDomainAdmin(result.admin),
            student: this.toDomainStudent(result.student),
        };
    }

    /**
     * Convert Prisma UserRefreshToken model sang Domain UserRefreshToken entity
     */
    static toDomainRefreshToken(prismaToken: any): UserRefreshToken | null {
        if (!prismaToken) return null;
        
        return new UserRefreshToken(
            prismaToken.tokenId,
            prismaToken.userId,
            prismaToken.familyId,
            prismaToken.tokenHash,
            prismaToken.expiresAt,
            prismaToken.createdAt,
            prismaToken.lastUsedAt,
            prismaToken.revokedAt,
            prismaToken.replacedByTokenId,
            prismaToken.userAgent,
            prismaToken.ipAddress,
            prismaToken.deviceFingerprint
        );
    }

    /**
     * Convert array của Prisma UserRefreshTokens sang array của Domain UserRefreshTokens
     */
    static toDomainRefreshTokens(prismaTokens: any[]): UserRefreshToken[] {
        return prismaTokens.map(token => this.toDomainRefreshToken(token)).filter(Boolean) as UserRefreshToken[];
    }
}
