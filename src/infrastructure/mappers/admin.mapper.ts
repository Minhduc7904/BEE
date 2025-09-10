// src/infrastructure/mappers/admin.mapper.ts
import { Admin } from '../../domain/entities/user/admin.entity';
import { UserMapper } from './user.mapper';

/**
 * Mapper class để convert từ Prisma Admin models sang Domain Admin entities
 */
export class AdminMapper {
    /**
     * Convert Prisma Admin model sang Domain Admin entity
     */
    static toDomainAdmin(prismaAdmin: any): Admin | undefined {
        if (!prismaAdmin) return undefined;

        return new Admin({
            adminId: prismaAdmin.adminId,
            userId: prismaAdmin.userId,
            subjectId: prismaAdmin.subjectId ?? undefined,
            user: UserMapper.toDomainUser(prismaAdmin.user) || undefined,
        });
    }

    /**
     * Convert array của Prisma Admins sang array của Domain Admins
     */
    static toDomainAdmins(prismaAdmins: any[]): Admin[] {
        return prismaAdmins.map(admin => this.toDomainAdmin(admin)).filter(Boolean) as Admin[];
    }
}
