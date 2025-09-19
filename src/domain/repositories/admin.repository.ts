// src/domain/repositories/admin.repository.ts
import { Admin } from '../entities/user/admin.entity'
import { CreateAdminData, UpdateAdminData } from '../interface/admin/admin.interface'

export interface IAdminRepository {
  create(data: CreateAdminData): Promise<Admin>
  findById(id: number): Promise<Admin | null>
  findByUserId(userId: number): Promise<Admin | null>
  update(id: number, data: UpdateAdminData): Promise<Admin>
  delete(id: number): Promise<boolean>
  findAll(): Promise<Admin[]>
}
