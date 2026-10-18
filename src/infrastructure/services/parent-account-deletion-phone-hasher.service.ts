import { Injectable } from '@nestjs/common'
import { createHmac } from 'crypto'
import { ParentAccountDeletionPhoneHasher } from '../../application/interfaces/parent-account-deletion.interface'

@Injectable()
export class HmacParentAccountDeletionPhoneHasher extends ParentAccountDeletionPhoneHasher {
  private readonly secret: string

  constructor() {
    super()
    const secret = process.env.ACCOUNT_DELETION_HMAC_SECRET
    if (!secret || secret.length < 32) {
      throw new Error('ACCOUNT_DELETION_HMAC_SECRET must contain at least 32 characters')
    }
    this.secret = secret
  }

  hashNormalizedPhone(phone: string): string {
    return createHmac('sha256', this.secret).update(phone, 'utf8').digest('hex')
  }
}
