// src/domain/repositories/admin.repository.ts
import { Admin } from '../entities/user/admin.entity';

export interface CreateAdminData {
    userId: number;
    subject?: string;
}

export interface IAdminRepository {
    create(data: CreateAdminData): Promise<Admin>;
    findById(id: number): Promise<Admin | null>;
    findByUserId(userId: number): Promise<Admin | null>;
    update(id: number, data: Partial<Admin>): Promise<Admin>;
    delete(id: number): Promise<boolean>;
    findAll(): Promise<Admin[]>;
}
