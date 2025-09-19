// src/infrastructure/services/email-verification-token.service.ts
import { Injectable } from '@nestjs/common'
import { randomBytes, createHash } from 'crypto'

@Injectable()
export class EmailVerificationTokenService {
  /**
   * Generate raw token và token hash
   */
  generateToken(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)

    return { rawToken, tokenHash }
  }

  /**
   * Hash một token để lưu vào database
   */
  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex')
  }

  /**
   * Verify một raw token với hash đã lưu
   */
  verifyToken(rawToken: string, storedHash: string): boolean {
    const computedHash = this.hashToken(rawToken)
    return computedHash === storedHash
  }

  /**
   * Generate expiry time (30 minutes from now)
   */
  generateExpiryTime(): Date {
    const now = new Date()
    return new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes
  }
}
