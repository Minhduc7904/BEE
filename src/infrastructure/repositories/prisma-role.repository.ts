import { Injectable, Inject } from "@nestjs/common";
import { Role } from "../../domain/entities/role/role.entity";
import { CreateRoleData, IRoleRepository, UpdateRoleData } from "../../domain/repositories/role.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { DomainMapper } from "../mappers/domain-mapper";

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
    constructor(
        @Inject(PrismaService) 
        private readonly prisma: PrismaService | any
    ) { } // ← Flexible: PrismaService hoặc TransactionClient

    async create(data: CreateRoleData): Promise<Role> {
        const created = await this.prisma.role.create({
            data: {
                roleName: data.roleName,
                description: data.description,
            },
        });

        return DomainMapper.toRoleDomain(created)!;
    }

    async findById(id: number): Promise<Role | null> {
        const role = await this.prisma.role.findUnique({
            where: { roleId: id },
        });

        if (!role) return null;

        return DomainMapper.toRoleDomain(role)!;
    }

    async findByName(name: string): Promise<Role | null> {
        const role = await this.prisma.role.findUnique({
            where: { roleName: name },
        });

        if (!role) return null;

        return DomainMapper.toRoleDomain(role)!;
    }

    async findAll(limit?: number, offset?: number): Promise<Role[]> {
        const roles = await this.prisma.role.findMany({
            take: limit,
            skip: offset,
        });

        return roles.map(r => DomainMapper.toRoleDomain(r)!).filter(Boolean) as Role[];
    }

    async update(id: number, data: UpdateRoleData): Promise<Role> {
        const updated = await this.prisma.role.update({
            where: { roleId: id },
            data: {
                roleName: data.roleName,
                description: data.description,
            },
        });

        return DomainMapper.toRoleDomain(updated)!;
    }

    async delete(id: number): Promise<void> {
        await this.prisma.role.delete({
            where: { roleId: id },
        });
    }

    async exists(id: number): Promise<boolean> {
        const count = await this.prisma.role.count({
            where: { roleId: id },
        });
        return count > 0;
    }

    async count(): Promise<number> {
        return await this.prisma.role.count();
    }
}