import { Injectable, Inject } from "@nestjs/common";
import { Role } from "../../domain/entities/role/role.entity";
import { UserRole } from "../../domain/entities/role/user-role.entity";
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

    async getUserRoles(userId: number): Promise<UserRole[]> {
        // Truy cập UserRole thông qua User relationship
        const user = await this.prisma.user.findUnique({
            where: { userId, isActive: true },
            include: {
                userRoles: {
                    where: {
                        isActive: true,
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    },
                    include: {
                        role: true,
                    },
                }
            }
        });

        if (!user || !user.userRoles) {
            console.log('No user or userRoles found for userId:', userId);
            return [];
        }

        return user.userRoles.map(userRole => new UserRole(
            userRole.userId,
            userRole.roleId,
            userRole.assignedAt,
            userRole.expiresAt,
            userRole.assignedBy,
            userRole.isActive,
            new Role(
                userRole.role.roleId,
                userRole.role.roleName,
                userRole.role.description,
                userRole.role.isAssignable,
                userRole.role.requiredByRoleId,
                userRole.role.createdAt
            )
        ));
    }
}