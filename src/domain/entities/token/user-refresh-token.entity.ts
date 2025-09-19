// src/domain/entities/user-refresh-token.entity.ts
export class UserRefreshToken {
  tokenId: number
  userId: number
  familyId: string // UUID để group refresh tokens
  tokenHash: string // Hash của refresh token
  expiresAt: Date
  createdAt: Date
  lastUsedAt?: Date
  revokedAt?: Date
  replacedByTokenId?: number
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string

  constructor(
    tokenId: number,
    userId: number,
    familyId: string,
    tokenHash: string,
    expiresAt: Date,
    createdAt?: Date,
    lastUsedAt?: Date,
    revokedAt?: Date,
    replacedByTokenId?: number,
    userAgent?: string,
    ipAddress?: string,
    deviceFingerprint?: string,
  ) {
    this.tokenId = tokenId
    this.userId = userId
    this.familyId = familyId
    this.tokenHash = tokenHash
    this.expiresAt = expiresAt
    this.createdAt = createdAt || new Date()
    this.lastUsedAt = lastUsedAt
    this.revokedAt = revokedAt
    this.replacedByTokenId = replacedByTokenId
    this.userAgent = userAgent
    this.ipAddress = ipAddress
    this.deviceFingerprint = deviceFingerprint
  }

  isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  isRevoked(): boolean {
    return this.revokedAt !== null && this.revokedAt !== undefined
  }

  isActive(): boolean {
    return !this.isExpired() && !this.isRevoked()
  }

  revoke(): void {
    this.revokedAt = new Date()
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date()
  }
}
