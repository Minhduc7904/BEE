import { Role } from '../entities/role/role.entity';
import { UserRole } from '../entities/role/user-role.entity';

export interface CreateRoleData {
    roleName: string;
    description?: string;
}

export interface UpdateRoleData {
    roleName?: string;
    description?: string;
}

export interface IRoleRepository {
    create(data: CreateRoleData): Promise<Role>;
    findById(id: number): Promise<Role | null>;
    findByName(name: string): Promise<Role | null>;
    findAll(limit?: number, offset?: number): Promise<Role[]>;
    update(id: number, data: UpdateRoleData): Promise<Role>;
    delete(id: number): Promise<void>;
    getUserRoles(userId: number): Promise<UserRole[]>;
    assignRoleToUser(userId: number, roleId: number, assignedBy?: number, expiresAt?: Date): Promise<UserRole>;
}