// src/infrastructure/repositories/prisma-admin.repository.ts
import { PrismaService } from '../../prisma/prisma.service';
import type { IAdminRepository, CreateAdminData } from '../../domain/repositories/admin.repository';
import { Admin } from '../../domain/entities/user/admin.entity';
import { AdminMapper } from '../mappers/admin.mapper';
import { NumberUtil } from '../../shared/utils/number.util';

export class PrismaAdminRepository implements IAdminRepository {
    constructor(private readonly prisma: PrismaService | any) {} // any để hỗ trợ transaction client

    async create(data: CreateAdminData): Promise<Admin> {
        const numericUserId = NumberUtil.ensureValidId(data.userId, 'User ID');
        
        const prismaAdmin = await this.prisma.admin.create({
            data: {
                userId: numericUserId,
                subject: data.subject,
            },
        });

        return AdminMapper.toDomainAdmin(prismaAdmin)!;
    }

    async findById(id: number): Promise<Admin | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Admin ID');
        
        const prismaAdmin = await this.prisma.admin.findUnique({
            where: { adminId: numericId },
            include: { user: true },
        });

        if (!prismaAdmin) return null;

        return AdminMapper.toDomainAdmin(prismaAdmin)!;
    }

    async findByUserId(userId: number): Promise<Admin | null> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        const prismaAdmin = await this.prisma.admin.findUnique({
            where: { userId: numericUserId },
            include: { user: true },
        });

        if (!prismaAdmin) return null;

        return AdminMapper.toDomainAdmin(prismaAdmin)!;
    }

    async update(id: number, data: Partial<Admin>): Promise<Admin> {
        const numericId = NumberUtil.ensureValidId(id, 'Admin ID');
        
        const prismaAdmin = await this.prisma.admin.update({
            where: { adminId: numericId },
            data: {
                subject: data.subject,
            },
        });

        return AdminMapper.toDomainAdmin(prismaAdmin)!;
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'Admin ID');
        
        try {
            await this.prisma.admin.delete({
                where: { adminId: numericId },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async findAll(): Promise<Admin[]> {
        const prismaAdmins = await this.prisma.admin.findMany({
            include: { user: true },
        });

        return AdminMapper.toDomainAdmins(prismaAdmins);
    }
}
