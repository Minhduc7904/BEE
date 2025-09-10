import { Injectable, Inject } from '@nestjs/common';
import { Role } from '../../domain/entities/role/role.entity';
import { UserRole } from '../../domain/entities/role/user-role.entity';
import { CreateRoleData, IRoleRepository, UpdateRoleData } from '../../domain/repositories/role.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleMapper } from "../mappers/role.mapper";
import { NumberUtil } from '../../shared/utils/number.util';
import { UserRoleMapper } from '../mappers/user-role.mapper';

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

        return RoleMapper.toDomainRole(created)!;
    }

    async findById(id: number): Promise<Role | null> {
        // Ensure id is a number
        const numericId = NumberUtil.ensureValidId(id, 'Role ID');
        
        const role = await this.prisma.role.findUnique({
            where: { roleId: numericId },
        });

        if (!role) return null;

        return RoleMapper.toDomainRole(role)!;
    }

    async findByName(name: string): Promise<Role | null> {
        const role = await this.prisma.role.findUnique({
            where: { roleName: name },
        });

        if (!role) return null;

        return RoleMapper.toDomainRole(role)!;
    }

    async findAll(limit?: number, offset?: number): Promise<Role[]> {
        const roles = await this.prisma.role.findMany({
            take: limit,
            skip: offset,
        });

        return RoleMapper.toDomainRoles(roles);
    }

    async update(id: number, data: UpdateRoleData): Promise<Role> {
        const numericId = NumberUtil.ensureValidId(id, 'Role ID');
        
        const updated = await this.prisma.role.update({
            where: { roleId: numericId },
            data: {
                roleName: data.roleName,
                description: data.description,
            },
        });

        return RoleMapper.toDomainRole(updated)!;
    }

    async delete(id: number): Promise<void> {
        const numericId = NumberUtil.ensureValidId(id, 'Role ID');
        
        await this.prisma.role.delete({
            where: { roleId: numericId },
        });
    }

    async exists(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'Role ID');
        
        const count = await this.prisma.role.count({
            where: { roleId: numericId },
        });
        return count > 0;
    }

    async count(): Promise<number> {
        return await this.prisma.role.count();
    }

    async getUserRoles(userId: number): Promise<UserRole[]> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        
        // Truy cập UserRole thông qua User relationship
        const user = await this.prisma.user.findUnique({
            where: { userId: numericUserId, isActive: true },
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
            console.log('No user or userRoles found for userId:', numericUserId);
            return [];
        }

        return UserRoleMapper.toDomainUserRoles(user.userRoles);
    }

    async assignRoleToUser(userId: number, roleId: number, assignedBy?: number, expiresAt?: Date): Promise<UserRole> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');
        const numericRoleId = NumberUtil.ensureValidId(roleId, 'Role ID');
        
        const created = await this.prisma.userRole.create({
            data: {
                userId: numericUserId,
                roleId: numericRoleId,
                assignedAt: new Date(),
                isActive: true,
                assignedBy: assignedBy || null,
                expiresAt: expiresAt || null,
            },
            include: {
                role: true,
            }
        });

        return new UserRole(
            created.userId,
            created.roleId,
            created.assignedAt,
            created.expiresAt,
            created.assignedBy,
            created.isActive,
            new Role(
                created.role.roleId,
                created.role.roleName,
                created.role.description,
                created.role.isAssignable,
                created.role.requiredByRoleId,
                created.role.createdAt
            )
        );
    }
}