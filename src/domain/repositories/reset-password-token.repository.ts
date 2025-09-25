// src/domain/repositories/reset-password-token.repository.ts
import { ResetPasswordToken } from '../entities'

export interface IResetPasswordTokenRepository {
    /** Tạo token reset mới */
    create(data: { userId: number; tokenHash: string; expiresAt: Date }): Promise<ResetPasswordToken>

    /** Tìm token theo userId (lấy token mới nhất của user) */
    findByUserId(userId: number): Promise<ResetPasswordToken | null>

    /** Tìm token theo tokenHash */
    findByTokenHash(tokenHash: string): Promise<ResetPasswordToken | null>

    /** Đánh dấu token đã được dùng */
    markAsUsed(id: number): Promise<ResetPasswordToken>

    /** Xoá tất cả token của user (ví dụ khi sinh token mới thì vô hiệu hoá token cũ) */
    deleteByUserId(userId: number): Promise<void>

    /** Xoá token đã hết hạn (dọn rác định kỳ) */
    deleteExpiredTokens(): Promise<number>
}
