// src/domain/repositories/user-refresh-token.repository.ts
import { UserRefreshToken } from '../entities/token/user-refresh-token.entity'

export interface CreateRefreshTokenData {
  userId: number
  familyId: string // UUID để group tokens
  tokenHash: string // Hash của refresh token
  expiresAt: Date
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string
}

export interface IUserRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<UserRefreshToken>
  findByTokenHash(tokenHash: string): Promise<UserRefreshToken | null>
  findByUserId(userId: number): Promise<UserRefreshToken[]>
  findByFamilyId(familyId: string): Promise<UserRefreshToken[]>
  deleteByUserId(userId: number): Promise<void> // Logout all devices
  deleteByTokenHash(tokenHash: string): Promise<boolean>
  deleteByFamilyId(familyId: string): Promise<void> // Delete token family
  deleteExpiredTokens(): Promise<number> // Cleanup expired tokens
  revokeToken(tokenHash: string): Promise<boolean> // Revoke token instead of delete
  revokeTokenWithReplacement(tokenHash: string, replacedByTokenId: number): Promise<boolean> // Revoke with replacement tracking
  revokeTokenFamily(familyId: string): Promise<number> // Revoke all tokens in family
  revokeAllUserTokens(userId: number): Promise<number> // Bulk revoke tokens for user
  replaceUserTokens(userId: number, data: CreateRefreshTokenData): Promise<UserRefreshToken> // Single device
  updateLastUsed(tokenHash: string): Promise<void> // Track usage
}
