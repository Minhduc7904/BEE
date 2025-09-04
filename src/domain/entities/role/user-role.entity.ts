// src/domain/entities/role/user-role.entity.ts

import { Role } from "./role.entity";

export interface UserInfo {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email?: string;
}

export class UserRole {
    userId: number;
    roleId: number;
    assignedAt: Date;
    expiresAt?: Date;
    assignedBy?: number;
    isActive: boolean;

    // Navigation properties
    role?: Role;
    user?: UserInfo;
    assignedByUser?: UserInfo;

    constructor(
        userId: number,
        roleId: number,
        assignedAt?: Date,
        expiresAt?: Date,
        assignedBy?: number,
        isActive: boolean = true,
        role?: Role,
        user?: UserInfo,
        assignedByUser?: UserInfo
    ) {
        this.userId = userId;
        this.roleId = roleId;
        this.assignedAt = assignedAt || new Date();
        this.expiresAt = expiresAt;
        this.assignedBy = assignedBy;
        this.isActive = isActive;
        this.role = role;
        this.user = user;
        this.assignedByUser = assignedByUser;
    }

    /**
     * Kiểm tra xem role có còn hiệu lực không
     */
    isValidRole(): boolean {
        if (!this.isActive) {
            return false;
        }

        if (!this.expiresAt) {
            return true; // Vĩnh viễn
        }

        return new Date() < this.expiresAt;
    }

    /**
     * Kiểm tra xem role có sắp hết hạn không (trong vòng số ngày nhất định)
     */
    isExpiringSoon(daysThreshold: number = 7): boolean {
        if (!this.expiresAt) {
            return false; // Vĩnh viễn
        }

        const now = new Date();
        const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
        
        return this.expiresAt <= thresholdDate && this.expiresAt > now;
    }

    /**
     * Kiểm tra xem role đã hết hạn chưa
     */
    isExpired(): boolean {
        if (!this.expiresAt) {
            return false; // Vĩnh viễn
        }

        return new Date() > this.expiresAt;
    }

    /**
     * Tính số ngày còn lại của role
     */
    getDaysRemaining(): number | null {
        if (!this.expiresAt) {
            return null; // Vĩnh viễn
        }

        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        
        if (diffTime <= 0) {
            return 0; // Đã hết hạn
        }

        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Gia hạn role thêm số ngày
     */
    extendRole(additionalDays: number): void {
        if (!this.expiresAt) {
            // Nếu role vĩnh viễn, tạo expiry date từ hôm nay
            this.expiresAt = new Date(Date.now() + (additionalDays * 24 * 60 * 60 * 1000));
        } else {
            // Nếu đã có expiry date, gia hạn thêm
            this.expiresAt = new Date(this.expiresAt.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
        }
    }

    /**
     * Vô hiệu hóa role
     */
    deactivate(): void {
        this.isActive = false;
    }

    /**
     * Kích hoạt lại role
     */
    activate(): void {
        this.isActive = true;
    }

    /**
     * Tạo role key để cache hoặc so sánh
     */
    getRoleKey(): string {
        return `user:${this.userId}:role:${this.roleId}`;
    }
}
