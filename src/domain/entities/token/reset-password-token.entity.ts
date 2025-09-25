// src/domain/entities/reset-password-token.entity.ts
export class ResetPasswordToken {
    id: number
    userId: number
    tokenHash: string
    expiresAt: Date
    createdAt: Date
    isUsed: boolean

    constructor(data: {
        id: number
        userId: number
        tokenHash: string
        expiresAt: Date
        createdAt: Date
        isUsed?: boolean
    }) {
        this.id = data.id
        this.userId = data.userId
        this.tokenHash = data.tokenHash
        this.expiresAt = data.expiresAt
        this.createdAt = data.createdAt
        this.isUsed = data.isUsed ?? false
    }

    /** Kiểm tra token đã hết hạn chưa */
    isExpired(): boolean {
        return new Date() > this.expiresAt
    }

    /** Kiểm tra token đã dùng chưa */
    isConsumed(): boolean {
        return this.isUsed
    }

    /** Token còn hợp lệ không */
    canBeUsed(): boolean {
        return !this.isExpired() && !this.isConsumed()
    }

    /** Đánh dấu token đã sử dụng */
    consume() {
        this.isUsed = true
    }
}
