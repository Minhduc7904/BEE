// src/infrastructure/repositories/prisma-admin.repository.ts
import { PrismaService } from '../../prisma/prisma.service';
import type { IAdminRepository, CreateAdminData } from '../../domain/repositories/admin.repository';
import { Admin } from '../../domain/entities/admin.entity';
import { DomainMapper } from '../mappers/domain-mapper';

export class PrismaAdminRepository implements IAdminRepository {
    constructor(private readonly prisma: PrismaService | any) {} // any để hỗ trợ transaction client

    async create(data: CreateAdminData): Promise<Admin> {
        const prismaAdmin = await this.prisma.admin.create({
            data: {
                userId: data.userId,
                subject: data.subject,
            },
        });

        return DomainMapper.toDomainAdmin(prismaAdmin)!;
    }

    async findById(id: number): Promise<Admin | null> {
        const prismaAdmin = await this.prisma.admin.findUnique({
            where: { adminId: id },
            include: { user: true },
        });

        if (!prismaAdmin) return null;

        return DomainMapper.toDomainAdmin(prismaAdmin)!;
    }

    async findByUserId(userId: number): Promise<Admin | null> {
        const prismaAdmin = await this.prisma.admin.findUnique({
            where: { userId },
            include: { user: true },
        });

        if (!prismaAdmin) return null;

        return DomainMapper.toDomainAdmin(prismaAdmin)!;
    }

    async update(id: number, data: Partial<Admin>): Promise<Admin> {
        const prismaAdmin = await this.prisma.admin.update({
            where: { adminId: id },
            data: {
                subject: data.subject,
            },
        });

        return DomainMapper.toDomainAdmin(prismaAdmin)!;
    }

    async delete(id: number): Promise<boolean> {
        try {
            await this.prisma.admin.delete({
                where: { adminId: id },
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

        return DomainMapper.toDomainAdmins(prismaAdmins);
    }
}
