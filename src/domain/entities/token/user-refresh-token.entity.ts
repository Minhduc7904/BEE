// src/domain/entities/user-refresh-token.entity.ts

export class UserRefreshToken {
  // Required properties
  tokenId: number
  userId: number
  familyId: string
  tokenHash: string
  expiresAt: Date
  createdAt: Date

  // Optional properties
  lastUsedAt?: Date
  revokedAt?: Date
  replacedByTokenId?: number
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string

  constructor(data: {
    tokenId: number
    userId: number
    familyId: string
    tokenHash: string
    expiresAt: Date
    createdAt?: Date
    lastUsedAt?: Date
    revokedAt?: Date
    replacedByTokenId?: number
    userAgent?: string
    ipAddress?: string
    deviceFingerprint?: string
  }) {
    this.tokenId = data.tokenId
    this.userId = data.userId
    this.familyId = data.familyId
    this.tokenHash = data.tokenHash
    this.expiresAt = data.expiresAt
    this.createdAt = data.createdAt || new Date()

    this.lastUsedAt = data.lastUsedAt
    this.revokedAt = data.revokedAt
    this.replacedByTokenId = data.replacedByTokenId
    this.userAgent = data.userAgent
    this.ipAddress = data.ipAddress
    this.deviceFingerprint = data.deviceFingerprint
  }

  /* ===================== SECURITY / DOMAIN METHODS ===================== */

  isExpired(at: Date = new Date()): boolean {
    return this.expiresAt < at
  }

  isRevoked(): boolean {
    return this.revokedAt !== undefined && this.revokedAt !== null
  }

  isActive(at: Date = new Date()): boolean {
    return !this.isExpired(at) && !this.isRevoked()
  }

  revoke(replacedByTokenId?: number): void {
    this.revokedAt = new Date()
    if (replacedByTokenId !== undefined) {
      this.replacedByTokenId = replacedByTokenId
    }
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date()
  }

  /**
   * Token có thuộc cùng family (rotation) không
   */
  isSameFamily(other: UserRefreshToken): boolean {
    return this.familyId === other.familyId
  }

  equals(other: UserRefreshToken): boolean {
    return this.tokenId === other.tokenId
  }

  toJSON() {
    return {
      tokenId: this.tokenId,
      userId: this.userId,
      familyId: this.familyId,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      revokedAt: this.revokedAt,
      replacedByTokenId: this.replacedByTokenId,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      deviceFingerprint: this.deviceFingerprint,
    }
  }

  clone(): UserRefreshToken {
    return new UserRefreshToken({
      tokenId: this.tokenId,
      userId: this.userId,
      familyId: this.familyId,
      tokenHash: this.tokenHash,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      revokedAt: this.revokedAt,
      replacedByTokenId: this.replacedByTokenId,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      deviceFingerprint: this.deviceFingerprint,
    })
  }
}
