import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'

interface RateLimitBucket {
  count: number
  resetsAt: number
}

@Injectable()
export class RecoveryRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>()

  consume(scope: string, tracker: string, limit: number, windowMs: number): number | null {
    const now = Date.now()
    const key = createHash('sha256').update(`${scope}:${tracker}`).digest('hex')
    const current = this.buckets.get(key)

    if (!current || current.resetsAt <= now) {
      this.buckets.set(key, { count: 1, resetsAt: now + windowMs })
      this.prune(now)
      return null
    }

    if (current.count >= limit) {
      return Math.max(1, Math.ceil((current.resetsAt - now) / 1000))
    }

    current.count += 1
    return null
  }

  private prune(now: number): void {
    if (this.buckets.size < 1000) return
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetsAt <= now) this.buckets.delete(key)
    }
  }
}
