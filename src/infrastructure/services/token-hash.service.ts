// src/infrastructure/services/token-hash.service.ts
import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { createHash } from 'crypto'

/**
 * Service để hash và verify refresh tokens
 * Sử dụng SHA-256 trước khi bcrypt để tránh giới hạn 72 byte của bcrypt
 */
@Injectable()
export class TokenHashService {
  private readonly saltRounds = 12

  /**
   * Pre-hash token bằng SHA-256 để tránh giới hạn 72 byte của bcrypt
   */
  private preHashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Hash refresh token trước khi lưu vào database
   * Sử dụng SHA-256 + bcrypt để đảm bảo security và tránh collision
   */
  async hashToken(token: string): Promise<string> {
    const preHashed = this.preHashToken(token)
    return bcrypt.hash(preHashed, this.saltRounds)
  }

  /**
   * So sánh token với hash trong database
   */
  async verifyToken(token: string, hash: string): Promise<boolean> {
    const preHashed = this.preHashToken(token)
    return bcrypt.compare(preHashed, hash)
  }
}
