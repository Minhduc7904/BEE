// src/domain/repositories/admin.repository.ts
import { Admin } from '../entities/user/admin.entity'
import { CreateAdminData, UpdateAdminData } from '../interface/admin/admin.interface'
export interface FindAllAdminsOptions {
  skip?: number
  take?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FindAllAdminsResult {
  data: Admin[]
  total: number
}

export interface IAdminRepository {
  create(data: CreateAdminData): Promise<Admin>
  findById(id: number): Promise<Admin | null>
  findByUserId(userId: number): Promise<Admin | null>
  update(id: number, data: UpdateAdminData): Promise<Admin>
  delete(id: number): Promise<boolean>
  findAll(): Promise<Admin[]>
  findAllWithPagination(options: FindAllAdminsOptions): Promise<FindAllAdminsResult>
}
