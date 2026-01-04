import { Role } from '../entities/role/role.entity'
import { UserRole } from '../entities/role/user-role.entity'

export interface CreateRoleData {
  roleName: string
  description?: string
  isAssignable?: boolean
}

export interface UpdateRoleData {
  roleName?: string
  description?: string
  isAssignable?: boolean  
}


export interface IRoleRepository {
  create(data: CreateRoleData): Promise<Role>
  findById(id: number): Promise<Role | null>
  findIdsByIds(ids: number[]): Promise<number[]>
  findByName(name: string): Promise<Role | null>
  findAll(limit?: number, offset?: number): Promise<Role[]>
  findAllWithPermissionsCount(limit?: number, offset?: number): Promise<(Role & { permissionsCount: number })[]>
  findByIdWithPermissions(id: number): Promise<(Role & { permissions: any[] }) | null>
  update(id: number, data: UpdateRoleData): Promise<Role>
  delete(id: number): Promise<void>
  getUserRoles(userId: number): Promise<UserRole[]>
  getUserRole(userId: number, roleId: number): Promise<UserRole | null>
  assignRoleToUser(userId: number, roleId: number, assignedBy?: number, expiresAt?: Date): Promise<UserRole>
  updateUserRole(userId: number, roleId: number, data: Partial<UserRole>): Promise<UserRole>
  removeRoleFromUser(userId: number, roleId: number, removedBy?: number): Promise<void>
  hasRole(userId: number, roleId: number): Promise<boolean>
  hasPermission(roleId: number, permissionId: number): Promise<boolean>
  addPermission(roleId: number, permissionId: number): Promise<void>
  removePermission(roleId: number, permissionId: number): Promise<void>
}
