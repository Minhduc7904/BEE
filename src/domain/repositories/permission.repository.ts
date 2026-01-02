import { Permission } from '../entities/role/permission.entity'

export interface CreatePermissionData {
  code: string
  name: string
  description?: string
  group?: string
  isSystem?: boolean
}

export interface UpdatePermissionData {
  code?: string
  name?: string
  description?: string
  group?: string
  isSystem?: boolean
}

export interface FindAllPermissionsOptions {
  skip?: number
  take?: number
  search?: string
  group?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FindAllPermissionsResult {
  data: Permission[]
  total: number
}

export interface IPermissionRepository {
  create(data: CreatePermissionData): Promise<Permission>
  findById(id: number): Promise<Permission | null>
  findByCode(code: string): Promise<Permission | null>
  findAll(limit?: number, offset?: number): Promise<Permission[]>
  findAllWithPagination(options: FindAllPermissionsOptions): Promise<FindAllPermissionsResult>
  findByGroup(group: string): Promise<Permission[]>
  getDistinctGroups(): Promise<string[]>
  update(id: number, data: UpdatePermissionData): Promise<Permission>
  delete(id: number): Promise<void>
}
